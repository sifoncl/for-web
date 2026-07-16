import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { createFormControl, createFormGroup } from "solid-forms";

import {
  ScreenShareFrameRate,
  ScreenShareResolutionId,
} from "@revolt/rtc/screenShareProfiles";
import { useState } from "@revolt/state";
import { Avatar, Column, Dialog, DialogProps, Form2, Ripple } from "@revolt/ui";

import { createMemo, Show } from "solid-js";
import { styled } from "styled-system/jsx";
import { Modals } from "../types";

export function ScreenSharePickerModal(
  props: DialogProps & Modals & { type: "screen_share_picker" },
) {
  const { voice } = useState();
  const { t } = useLingui();

  const group = createFormGroup({
    resolutionId: createFormControl<ScreenShareResolutionId>(
      voice.screenShareResolution,
    ),
    frameRate: createFormControl(String(voice.screenShareFrameRate)),
    audio: createFormControl(voice.screenShareAudio),
    idx: createFormControl([0], { required: true }),
  });

  async function onSubmit() {
    props.callback(
      group.controls.idx.value[0],
      group.controls.resolutionId.value,
      Number(group.controls.frameRate.value) as ScreenShareFrameRate,
      group.controls.audio.value,
    );
    props.onClose();
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  const sources = createMemo(() =>
    props.sources.map((source) => {
      return { item: source, value: source.idx };
    }),
  );

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={() => {
        props.onCancel();
        props.onClose();
      }}
      title={t`Pick a Screen to Share`}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Go</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
        },
      ]}
    >
      <form onSubmit={submit}>
        <Column>
          <Form2.VirtualSelect
            control={group.controls.idx}
            items={sources()}
            selectHeight="max(30vh, 200px)"
            isMaxHeight={true}
            itemHeight={110}
          >
            {(val, selected) => (
              <Item selected={selected}>
                <Ripple />
                <Show
                  when={val.image}
                  fallback={
                    <Avatar
                      fallback={val.name}
                      size={96}
                      shape="rounded-square"
                    />
                  }
                >
                  <Preview src={val.image} alt="" />
                </Show>
                <span>{val.name}</span>
              </Item>
            )}
          </Form2.VirtualSelect>
          <strong>
            <Trans>Resolution</Trans>
          </strong>
          <Form2.ButtonGroup
            control={group.controls.resolutionId}
            buttonDefinitions={props.resolutions.map((resolution) => {
              return {
                children: resolution.label,
                value: resolution.id,
              };
            })}
          />
          <strong>
            <Trans>Frame rate</Trans>
          </strong>
          <Form2.ButtonGroup
            control={group.controls.frameRate}
            buttonDefinitions={[5, 30, 60].map((fps) => ({
              children: `${fps} FPS`,
              value: String(fps),
            }))}
          />
          <Form2.Checkbox control={group.controls.audio}>
            <Trans>Share audio</Trans>
          </Form2.Checkbox>
        </Column>
      </form>
    </Dialog>
  );
}

const Item = styled("div", {
  base: {
    height: "110px",
    display: "flex",
    position: "relative",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-sm)",
  },
  variants: {
    selected: {
      true: {
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",
      },
    },
  },
});

const Preview = styled("img", {
  base: {
    width: "160px",
    height: "90px",
    flexShrink: 0,
    objectFit: "contain",
    background: "black",
    borderRadius: "var(--borderRadius-sm)",
  },
});
