import SpiralEncoder from './SpiralEncoder';
import { grayPixel, Pixel } from '../../util/Pixel';
import { VinylFormat } from '../VinylFormat';

export default class GraySpiralEncoder extends SpiralEncoder {
  protected getFormat(): VinylFormat {
    return VinylFormat.GRAY;
  }

  protected getPixels(data: Uint8Array): Pixel[] {
    const pixels: Pixel[] = [];
    data.forEach(byte => pixels.push(grayPixel(byte)));
    return pixels;
  }
}