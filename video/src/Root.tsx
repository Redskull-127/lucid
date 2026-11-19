import { Composition } from "remotion";
import { DURATION, FPS, Promo } from "./Promo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Promo16x9" component={Promo} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="Promo9x16" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    </>
  );
};
