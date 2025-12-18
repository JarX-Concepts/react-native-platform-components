// DatePickerDemo.tsx
import React, { useMemo, useState } from 'react';
import { Platform, Switch, View } from 'react-native';
import {
  DatePicker,
  SelectionMenu,
  type AndroidMaterialMode,
} from 'react-native-platform-components';

import { ActionField, Divider, PillButton, Row, Section, ui } from './DemoUI';

const prettyISO = (date?: Date | null) => (date ? date.toISOString() : '—');

export function DatePickerDemo(): React.JSX.Element {
  // ----- Presentation -----
  const [presentationModal, setPresentationModal] = useState(true);
  const [open, setOpen] = useState(false);

  const presentation = presentationModal ? 'modal' : 'embedded';
  const visible = presentationModal ? open : undefined;

  // ----- Core value -----
  const [mode, setMode] = useState<'date' | 'time' | 'dateAndTime'>('date');
  const [date, setDate] = useState<Date | null>(null);

  // ----- Min / Max -----
  const [minEnabled, setMinEnabled] = useState(false);
  const [maxEnabled, setMaxEnabled] = useState(false);

  const minDate = useMemo(() => {
    if (!minEnabled) return null;
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minEnabled]);

  const maxDate = useMemo(() => {
    if (!maxEnabled) return null;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [maxEnabled]);

  // ----- iOS options -----
  const [iosStyle, setIosStyle] = useState<
    'automatic' | 'compact' | 'inline' | 'wheels'
  >('automatic');

  const [iosMinuteInterval, setIosMinuteInterval] = useState<
    'inherit' | '1' | '5' | '10' | '15'
  >('inherit');

  const [iosRounds, setIosRounds] = useState<'inherit' | 'round' | 'noRound'>(
    'inherit'
  );

  // ----- Android options -----
  const [androidMaterial, setAndroidMaterial] =
    useState<AndroidMaterialMode>('system');

  const [androidTitleEnabled, setAndroidTitleEnabled] = useState(true);
  const [androidButtonsEnabled, setAndroidButtonsEnabled] = useState(true);

  const dialogTitle = androidTitleEnabled ? 'Custom Title' : undefined;
  const positiveTitle = androidButtonsEnabled ? 'Custom OK' : undefined;
  const negativeTitle = androidButtonsEnabled ? 'Custom Cancel' : undefined;

  // ----- SelectionMenu options -----
  const modeOptions = useMemo(
    () =>
      [
        { label: 'Date', data: 'date' },
        { label: 'Time', data: 'time' },
        { label: 'Date & Time', data: 'dateAndTime' },
      ] as const,
    []
  );

  const iosStyleOptions = useMemo(
    () =>
      [
        { label: 'Automatic', data: 'automatic' },
        { label: 'Compact', data: 'compact' },
        { label: 'Inline', data: 'inline' },
        { label: 'Wheels', data: 'wheels' },
      ] as const,
    []
  );

  const iosMinuteOptions = useMemo(
    () =>
      [
        { label: 'Default', data: 'inherit' },
        { label: '1', data: '1' },
        { label: '5', data: '5' },
        { label: '10', data: '10' },
        { label: '15', data: '15' },
      ] as const,
    []
  );

  const iosRoundsOptions = useMemo(
    () =>
      [
        { label: 'Inherit', data: 'inherit' },
        { label: 'Round', data: 'round' },
        { label: 'No Round', data: 'noRound' },
      ] as const,
    []
  );

  const androidMaterialOptions = useMemo(
    () =>
      [
        { label: 'System', data: 'system' },
        { label: 'M3', data: 'm3' },
      ] as const,
    []
  );

  // ----- Render -----
  return (
    <>
      <Section title="Basics">
        <Row label="Modal">
          <Switch
            value={presentationModal}
            onValueChange={(v) => {
              setPresentationModal(v);
              if (!v) setOpen(false);
            }}
          />
        </Row>

        <Divider />

        <Row label="Mode">
          <SelectionMenu
            style={ui.fullFlex}
            options={modeOptions as any}
            selected={mode}
            inlineMode
            placeholder="Mode"
            onSelect={(data) => setMode(data as any)}
          />
        </Row>

        <Divider />

        <Row
          label="Value"
          right={
            <PillButton
              label="Clear"
              disabled={!date}
              onPress={() => setDate(null)}
            />
          }
        >
          <ActionField
            text={prettyISO(date)}
            placeholder="Tap to set now"
            numberOfLines={1}
            onPress={() => {
              const d = new Date();
              d.setSeconds(0, 0);
              setDate(d);
            }}
          />
        </Row>

        <Divider />

        <Row label="Min (−30d)">
          <Switch value={minEnabled} onValueChange={setMinEnabled} />
        </Row>

        <Row label="Max (+30d)">
          <Switch value={maxEnabled} onValueChange={setMaxEnabled} />
        </Row>
      </Section>

      {Platform.OS === 'ios' && (
        <Section title="iOS">
          <Row label="Style">
            <SelectionMenu
              style={ui.fullFlex}
              options={iosStyleOptions as any}
              selected={iosStyle}
              inlineMode
              placeholder="Style"
              onSelect={(data) => setIosStyle(data as any)}
            />
          </Row>

          <Divider />

          <Row label="Minute">
            <SelectionMenu
              style={ui.fullFlex}
              options={iosMinuteOptions as any}
              selected={iosMinuteInterval}
              inlineMode
              placeholder="Minute Interval"
              onSelect={(data) => setIosMinuteInterval(data as any)}
            />
          </Row>

          <Divider />

          <Row label="Rounds">
            <SelectionMenu
              style={ui.fullFlex}
              options={iosRoundsOptions as any}
              selected={iosRounds}
              inlineMode
              placeholder="Rounds"
              onSelect={(data) => setIosRounds(data as any)}
            />
          </Row>
        </Section>
      )}

      {Platform.OS === 'android' && (
        <Section title="Android">
          <Row label="Material">
            <SelectionMenu
              style={ui.fullFlex}
              options={androidMaterialOptions as any}
              selected={androidMaterial}
              inlineMode
              placeholder="Material"
              onSelect={(data) =>
                setAndroidMaterial(data as AndroidMaterialMode)
              }
            />
          </Row>

          <Divider />

          <Row label="Dialog Title">
            <Switch
              value={androidTitleEnabled}
              onValueChange={setAndroidTitleEnabled}
            />
          </Row>

          <Row label="Buttons">
            <Switch
              value={androidButtonsEnabled}
              onValueChange={setAndroidButtonsEnabled}
            />
          </Row>
        </Section>
      )}

      <Section title="Picker">
        {presentationModal && (
          <>
            <Row
              label="Picker"
              right={
                <PillButton
                  label={open ? 'Close' : 'Open'}
                  onPress={() => setOpen((p) => !p)}
                />
              }
            >
              <ActionField
                text={open ? 'open' : 'closed'}
                onPress={() => setOpen((p) => !p)}
              />
            </Row>

            <Divider />
          </>
        )}

        <View style={ui.datePickerContainer}>
          <DatePicker
            presentation={presentation}
            visible={visible}
            date={date}
            minDate={minDate ?? undefined}
            maxDate={maxDate ?? undefined}
            mode={mode}
            ios={{
              preferredStyle: iosStyle,
              minuteInterval:
                iosMinuteInterval === 'inherit'
                  ? undefined
                  : Number(iosMinuteInterval),
              roundsToMinuteInterval: iosRounds,
            }}
            android={{
              material: androidMaterial,
              dialogTitle,
              positiveButtonTitle: positiveTitle,
              negativeButtonTitle: negativeTitle,
            }}
            onCancel={() => setOpen(false)}
            onConfirm={(newDate: Date) => {
              setDate(newDate);
              // optionally close modal here:
              // setOpen(false);
            }}
          />
        </View>
      </Section>
    </>
  );
}
