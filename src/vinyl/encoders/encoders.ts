import RainbowSpiral from './RainbowSpiral';
import GraySpiral from './GraySpiral';
import EncoderDecoder from './EncoderDecoder';
import CanvasImage from '../CanvasImage';

export enum Encoding {
  GRAY_SPIRAL,
  RAINBOW_SPIRAL,
}

const encoders = {
  [Encoding.GRAY_SPIRAL]: GraySpiral,
  [Encoding.RAINBOW_SPIRAL]: RainbowSpiral,
};

export function getEncoder(encoding: Encoding): EncoderDecoder<unknown> {
  const Encoder = encoders[encoding];
  if (!Encoder) {
    throw new Error('Unknown encoding');
  }
  return new Encoder();
}

export function getDecoder(vinyl: CanvasImage): EncoderDecoder<unknown> {
  const vix = vinyl.getPixel(0, 0);
  const yl = vinyl.getPixel(1, 0);

  // Check if the top-left RGB values decode to "Vixyl".
  if (vix.red !== 86 || vix.green !== 105 || vix.blue !== 120 || yl.red !== 121 || yl.green !== 108) {
    throw new Error('Invalid header');
  }

  return getEncoder(yl.blue);
}
