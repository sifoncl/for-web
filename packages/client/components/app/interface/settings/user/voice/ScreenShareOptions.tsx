import { Trans } from "@lingui-solid/solid/macro";

import { useVoice } from "@revolt/rtc";
import {
  ScreenShareFrameRate,
  ScreenShareResolutionId,
} from "@revolt/rtc/screenShareProfiles";
import { useState } from "@revolt/state";
import {
  CategoryButton,
  CategorySelectOption,
  Checkbox,
  Column,
  Text,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

export function ScreenShareOptions() {
  const { voice } = useState();
  const voiceContext = useVoice();

  const resolutions = voiceContext.getEnabledScreenShareResolutions();

  return (
    <Column>
      <Text class="title">
        <Trans>Screen Share Settings</Trans>
      </Text>
      <CategoryButton.Group>
        <CategoryButton.Select
          icon={<Symbol>screen_share</Symbol>}
          title={<Trans>Resolution</Trans>}
          options={
            Object.fromEntries(
              resolutions.map((resolution) => [
                resolution.id,
                {
                  title:
                    resolution.id === "source" ? (
                      <Trans>Source</Trans>
                    ) : resolution.id === "4k" ? (
                      "4K"
                    ) : (
                      resolution.id
                    ),
                },
              ]),
            ) as { [key in ScreenShareResolutionId]: CategorySelectOption }
          }
          value={voice.screenShareResolution}
          onUpdate={(ns) => (voice.screenShareResolution = ns)}
        />
        <CategoryButton.Select
          icon="blank"
          title={<Trans>Frame rate</Trans>}
          options={
            Object.fromEntries(
              [5, 30, 60].map((fps) => [String(fps), { title: `${fps} FPS` }]),
            ) as unknown as {
              [key in ScreenShareFrameRate]: CategorySelectOption;
            }
          }
          value={String(voice.screenShareFrameRate)}
          onUpdate={(fps) =>
            (voice.screenShareFrameRate = Number(fps) as ScreenShareFrameRate)
          }
        />
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={voice.screenShareQualityAsk} />}
          onClick={() =>
            (voice.screenShareQualityAsk = !voice.screenShareQualityAsk)
          }
        >
          <Trans>Always Ask for Screen Share Quality</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
