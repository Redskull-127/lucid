import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  /** File stem under /img, e.g. "bench-success" for bench-success-{light,dark}.svg */
  name: string;
  alt: string;
  width: number;
  height: number;
  caption?: ReactNode;
  /** Narrowest the image may render on small screens before the plate scrolls sideways. */
  minWidth?: number;
  /** Above the fold: raise fetch priority. Both stay lazy so only the visible theme's file loads. */
  important?: boolean;
};

/**
 * A chart or diagram that swaps its light and dark variant with the site theme (OS preference or toggle).
 * Both images stay lazy, so the browser only fetches the visible one. On phones the image keeps a readable
 * minimum width and the plate scrolls sideways instead of shrinking the text to nothing.
 */
export function ThemedFigure({ name, alt, width, height, caption, minWidth = 600, important }: Props) {
  const priority = important ? ("high" as const) : undefined;
  const kind = name.startsWith("bench") ? "chart" : "diagram";
  return (
    <figure className="plate">
      <div
        className="plate-scroll"
        style={{ "--plate-min": `${minWidth}px` } as CSSProperties}
        tabIndex={0}
        role="region"
        aria-label={kind === "chart" ? "Chart" : "Diagram"}
      >
        <Image
          className="only-light"
          src={`/img/${name}-light.svg`}
          alt={alt}
          width={width}
          height={height}
          fetchPriority={priority}
        />
        <Image
          className="only-dark"
          src={`/img/${name}-dark.svg`}
          alt={alt}
          width={width}
          height={height}
          fetchPriority={priority}
        />
      </div>
      <p className="scroll-hint">Scroll sideways to see the whole {kind}.</p>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
