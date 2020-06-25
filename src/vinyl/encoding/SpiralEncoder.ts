import { Spiral } from './Spiral';
import { isSamePoint, Point } from '../../util/Point';
import { encodeInt24Pixel, encodeStringGrayPixels, grayPixel, Pixel } from '../../util/Pixel';
import { VinylFormat } from '../VinylFormat';
import { FileInfo } from '../FileInfo';
import { SpiralData } from './SpiralData';
import { drawCircle, drawPixel } from '../../util/draw';
import { DrawOptions } from './DrawOptions';

export default abstract class SpiralEncoder {
  protected abstract getFormat(): VinylFormat;

  protected abstract getPixels(data: Uint8Array): Pixel[];

  public encode(file: FileInfo): SpiralData {
    // Get all pixels that need to be drawn.
    const pixels = [
      ...encodeStringGrayPixels('Vixyl'),   // Header
      grayPixel(this.getFormat()),          // Encoder type
      encodeInt24Pixel(file.type.length),   // File type length
      ...encodeStringGrayPixels(file.type), // File type
      encodeInt24Pixel(file.data.length),   // File length
      ...this.getPixels(file.data),         // Data
    ];

    // Create the spiral.
    const spiral = this.createSpiral(pixels.length);

    return ({
      pixels,
      points: spiral.points,
      size: spiral.radius * 2 + 10,
    });
  }

  public async draw(context: CanvasRenderingContext2D, data: SpiralData, options: DrawOptions): Promise<void> {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Get the canvas center.
    const center = {
      x: context.canvas.width / 2,
      y: context.canvas.height / 2,
    };

    // Draw the back and inner circle.
    drawCircle(context, center.x, center.y, data.size / 2, `rgba(${options.bgColor.r}, ${options.bgColor.g}, ${options.bgColor.b}, ${options.bgColor.a})`);
    drawCircle(context, center.x, center.y, data.points[data.points.length - 1].x - 5, 'white');

    // Add the QR code.
    if (options.addQr) {
      const qrImg = new Image();
      await new Promise(res => {
        qrImg.addEventListener('load', () => {
          context.drawImage(qrImg, Math.round(center.x - qrImg.width / 2), Math.round(center.y - qrImg.height / 2));
          res();
        });
        qrImg.src = 'vixyl/qr.png';
      });
    }

    // Draw all the spiral pixels.
    for (let i = 0; i < data.points.length; i++) {
      const point = data.points[i];
      drawPixel(context, point.x + center.x, point.y + center.y, data.pixels[i]);
    }
  }

  protected createSpiral(length: number): Spiral {
    const points: Point[] = [];
    let radius = 0;

    const a = 0.5;

    let dT = 0.1;
    let t = Math.PI * 30;
    let previousPoint: Point | undefined;

    const self = this;

    function isPointValid(nextPoint: Point): boolean {
      // If this is the first point, no checks needed.
      if (!previousPoint) {
        return true;
      }

      // Check if the next point is the same as the previous point.
      if (isSamePoint(nextPoint, previousPoint)) {
        dT *= 1.5;
        return false;
      }

      // Check if the next point touches the previous point;
      if (!self.isNeighbor(nextPoint, previousPoint)) {
        dT /= 2;
        return false;
      }

      return true;
    }

    for (let i = 0; i < length; i++) {
      let valid = false;
      let nextPoint = { x: 0, y: 0 };

      while (!valid) {
        // Get the next point.
        nextPoint = {
          x: Math.floor(a * t * Math.cos(t + dT)),
          y: Math.floor(a * t * Math.sin(t + dT)),
        };

        // Check if the next point is adjacent to the previous point.
        valid = isPointValid(nextPoint);
      }

      // Check if the previous point can be removed.
      if (i > 1 && this.isNeighbor(points[i - 2], nextPoint)) {
        delete points[i--];
      }

      // Check the radius.
      const absX = Math.abs(nextPoint.x);
      if (absX > radius) {
        radius = absX;
      }
      const absY = Math.abs(nextPoint.y);
      if (absY > radius) {
        radius = absY;
      }

      // Store the next point, update the previous.
      points[i] = nextPoint;
      previousPoint = nextPoint;

      // Increase t.
      t += dT;
    }

    return ({
      points: points.reverse(),
      radius,
    });
  }

  private isNeighbor(a: Point, b: Point): boolean {
    return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
  }
}