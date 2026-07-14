// Papan tanda tangan — gambar langsung (jari/mouse). Menghasilkan PNG untuk diunggah.
// Web: raster SVG -> PNG via canvas. Native: pakai react-native-svg toDataURL.
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../../config/theme';

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  getPngDataUrl: () => Promise<string | null>;
}

const G: any = globalThis as any;

function svgToPngWeb(svg: string, w: number, h: number): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new G.Image();
      img.onload = () => {
        const canvas = G.document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;base64,' + G.btoa(unescape(encodeURIComponent(svg)));
    } catch {
      resolve(null);
    }
  });
}

export const SignaturePad = forwardRef<SignaturePadRef, { height?: number }>(
  function SignaturePad({ height = 170 }, ref) {
    const [paths, setPaths] = useState<string[]>([]);
    const currentRef = useRef('');
    const [current, setCurrent] = useState('');
    const widthRef = useRef(300);
    const svgRef = useRef<any>(null);

    const pan = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setCurrent(currentRef.current);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setCurrent(currentRef.current);
        },
        onPanResponderRelease: () => {
          const finished = currentRef.current;
          if (finished !== '') {
            currentRef.current = '';
            setPaths((p) => [...p, finished]);
            setCurrent('');
          }
        },
      }),
    ).current;

    useImperativeHandle(ref, () => ({
      clear: () => {
        setPaths([]);
        currentRef.current = '';
        setCurrent('');
      },
      isEmpty: () => paths.length === 0 && currentRef.current === '',
      getPngDataUrl: async () => {
        const all = [...paths, currentRef.current].filter((d) => d !== '');
        if (all.length === 0) return null;
        const w = Math.round(widthRef.current) || 300;
        const h = height;
        if (Platform.OS === 'web') {
          const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
            `<rect width="100%" height="100%" fill="white"/>` +
            all
              .map(
                (d) =>
                  `<path d="${d}" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
              )
              .join('') +
            `</svg>`;
          return svgToPngWeb(svg, w, h);
        }
        // Native: react-native-svg toDataURL (base64 PNG)
        return new Promise((resolve) => {
          const svg = svgRef.current;
          if (svg && typeof svg.toDataURL === 'function') {
            svg.toDataURL((b64: string) => resolve('data:image/png;base64,' + b64));
          } else {
            resolve(null);
          }
        });
      },
    }));

    return (
      <View
        style={[styles.pad, { height }]}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
        }}
        {...pan.panHandlers}
      >
        <Svg ref={svgRef} width="100%" height="100%">
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke="#111" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {current !== '' && (
            <Path d={current} stroke="#111" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </Svg>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  pad: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
});
