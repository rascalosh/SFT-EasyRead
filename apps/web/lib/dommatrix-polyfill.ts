// pdf-parse (via pdfjs-dist) only attempts to load the native @napi-rs/canvas
// binary to polyfill DOMMatrix if globalThis.DOMMatrix isn't already set. That
// native binary doesn't reliably survive Vercel's serverless function
// bundling, so we pre-define a minimal, numerically correct 2D DOMMatrix here
// to skip that path entirely. Only the 2D affine subset (a,b,c,d,e,f) is
// implemented, since that's all pdf.js needs for text-extraction geometry.
class DOMMatrixPolyfill {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(init?: number[]) {
    if (Array.isArray(init) && init.length >= 6) {
      this.a = init[0]!;
      this.b = init[1]!;
      this.c = init[2]!;
      this.d = init[3]!;
      this.e = init[4]!;
      this.f = init[5]!;
    } else {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  }

  multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill([
      this.a * other.a + this.c * other.b,
      this.b * other.a + this.d * other.b,
      this.a * other.c + this.c * other.d,
      this.b * other.c + this.d * other.d,
      this.a * other.e + this.c * other.f + this.e,
      this.b * other.e + this.d * other.f + this.f,
    ]);
  }

  translate(tx: number, ty: number): DOMMatrixPolyfill {
    return this.multiply(new DOMMatrixPolyfill([1, 0, 0, 1, tx, ty]));
  }

  scale(sx: number, sy: number = sx): DOMMatrixPolyfill {
    return this.multiply(new DOMMatrixPolyfill([sx, 0, 0, sy, 0, 0]));
  }

  inverse(): DOMMatrixPolyfill {
    const det = this.a * this.d - this.b * this.c;
    return new DOMMatrixPolyfill([
      this.d / det,
      -this.b / det,
      -this.c / det,
      this.a / det,
      (this.c * this.f - this.d * this.e) / det,
      (this.b * this.e - this.a * this.f) / det,
    ]);
  }
}

if (typeof globalThis.DOMMatrix === "undefined") {
  // @ts-expect-error - minimal 2D polyfill, not the full DOMMatrix spec
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}
