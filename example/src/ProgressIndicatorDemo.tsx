// ProgressIndicatorDemo.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { ProgressIndicator } from 'react-native-platform-components';
import { Divider, PillButton, Row, Section, ui, useDemoColors } from './DemoUI';

const STEPS = 5;
const isAndroid = Platform.OS === 'android';

export function ProgressIndicatorDemo(): React.JSX.Element {
  const colors = useDemoColors();
  // undefined = indeterminate
  const [progress, setProgress] = useState<number | undefined>(0.4);
  const [step, setStep] = useState(2);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // "Simulate upload": 0 to 100% in steps, each change animating
  useEffect(() => {
    if (!running) return undefined;
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((current) => {
        const next = Math.min(1, (current ?? 0) + 0.1);
        if (next >= 1) setRunning(false);
        return next;
      });
    }, 400);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const set = (value: number | undefined) => {
    setRunning(false);
    setProgress(value);
  };

  const percent =
    progress === undefined ? 'indeterminate' : `${Math.round(progress * 100)}%`;

  return (
    <>
      <Section title="Linear">
        <View style={styles.block}>
          <ProgressIndicator
            testID="progress-linear"
            progress={progress}
            accessibilityLabel="Upload"
          />
        </View>
        <Divider />
        <Row label="Progress">
          <Text testID="progress-value" style={ui.valueText}>
            {percent}
          </Text>
        </Row>
        <View style={styles.pills}>
          <PillButton
            testID="progress-set-0"
            label="0%"
            onPress={() => set(0)}
          />
          <PillButton
            testID="progress-set-40"
            label="40%"
            onPress={() => set(0.4)}
          />
          <PillButton
            testID="progress-set-100"
            label="100%"
            onPress={() => set(1)}
          />
          <PillButton
            testID="progress-set-indeterminate"
            label="Indeterminate"
            onPress={() => set(undefined)}
          />
          <PillButton
            testID="progress-simulate"
            label="Simulate upload"
            onPress={() => setRunning(true)}
          />
        </View>
        <Divider />
        <View style={styles.block}>
          <Text style={[styles.caption, { color: colors.placeholder }]}>
            Indeterminate
          </Text>
          <ProgressIndicator
            testID="progress-indeterminate"
            accessibilityLabel="Loading feed"
          />
        </View>
        <Divider />
        <View style={styles.block}>
          <Text style={[styles.caption, { color: colors.placeholder }]}>
            Wavy{isAndroid ? '' : ' (Android; a plain bar on iOS)'}
          </Text>
          <ProgressIndicator
            testID="progress-wavy"
            progress={progress}
            accessibilityLabel="Wavy upload"
            android={{ wavy: true }}
          />
          <ProgressIndicator
            testID="progress-wavy-indeterminate"
            style={styles.gapTop}
            accessibilityLabel="Wavy loading"
            android={{ wavy: true }}
          />
        </View>
      </Section>

      <Section title="Steps">
        <View style={styles.block}>
          <ProgressIndicator
            testID="progress-steps"
            progress={step / STEPS}
            segments={STEPS}
            accessibilityLabel="Checkout"
            accessibilityValue={{ text: `Step ${step} of ${STEPS}` }}
          />
        </View>
        <Divider />
        <Row
          label="Step"
          right={
            <View style={styles.inlinePills}>
              <PillButton
                testID="progress-step-back"
                label="Back"
                disabled={step === 0}
                onPress={() => setStep((s) => Math.max(0, s - 1))}
              />
              <PillButton
                testID="progress-step-next"
                label="Next"
                disabled={step === STEPS}
                onPress={() => setStep((s) => Math.min(STEPS, s + 1))}
              />
            </View>
          }
        >
          <Text testID="progress-step-value" style={ui.valueText}>
            {step} of {STEPS}
          </Text>
        </Row>
      </Section>

      <Section title="Circular">
        <View style={styles.circles}>
          <View style={styles.circle}>
            <ProgressIndicator
              testID="progress-circular-small"
              variant="circular"
              size="small"
              accessibilityLabel="Small spinner"
            />
            <Text style={[styles.caption, { color: colors.placeholder }]}>
              small
            </Text>
          </View>
          <View style={styles.circle}>
            <ProgressIndicator
              testID="progress-circular-large"
              variant="circular"
              size="large"
              accessibilityLabel="Large spinner"
            />
            <Text style={[styles.caption, { color: colors.placeholder }]}>
              large
            </Text>
          </View>
          <View style={styles.circle}>
            <ProgressIndicator
              testID="progress-circular"
              variant="circular"
              size="large"
              progress={progress}
              accessibilityLabel="Download"
            />
            <Text style={[styles.caption, { color: colors.placeholder }]}>
              {percent}
            </Text>
          </View>
          <View style={styles.circle}>
            <ProgressIndicator
              testID="progress-circular-wavy"
              variant="circular"
              size="large"
              progress={progress}
              android={{ wavy: true }}
              accessibilityLabel="Wavy download"
            />
            <Text style={[styles.caption, { color: colors.placeholder }]}>
              wavy
            </Text>
          </View>
        </View>
      </Section>

      <Section title="Loading">
        <View style={styles.circles}>
          <View style={styles.circle}>
            <ProgressIndicator
              testID="progress-loading"
              variant="loading"
              accessibilityLabel="Loading"
            />
            <Text style={[styles.caption, { color: colors.placeholder }]}>
              loading
            </Text>
          </View>
          <View style={styles.circle}>
            <ProgressIndicator
              testID="progress-loading-contained"
              variant="loading"
              size="large"
              color="#7C4DFF"
              trackColor="#EADDFF"
              accessibilityLabel="Loading (contained)"
            />
            <Text style={[styles.caption, { color: colors.placeholder }]}>
              {isAndroid ? 'contained' : 'large'}
            </Text>
          </View>
        </View>
      </Section>

      <Section title="Colors">
        <View style={styles.block}>
          <ProgressIndicator
            testID="progress-colors"
            progress={progress}
            color="#FF6B35"
            trackColor="#FFD8C8"
            accessibilityLabel="Custom colors"
          />
        </View>
        <Divider />
        <View style={styles.circles}>
          <ProgressIndicator
            testID="progress-colors-circular"
            variant="circular"
            size="large"
            progress={progress}
            color="#2E7D32"
            trackColor="#C8E6C9"
            accessibilityLabel="Custom colors ring"
          />
          <ProgressIndicator
            testID="progress-colors-spinner"
            variant="circular"
            size="large"
            color="#2E7D32"
            accessibilityLabel="Custom colors spinner"
          />
        </View>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 12, paddingVertical: 16 },
  caption: { fontSize: 12, marginBottom: 8 },
  gapTop: { marginTop: 16 },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  inlinePills: { flexDirection: 'row', gap: 8 },
  circles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    gap: 12,
  },
  circle: { alignItems: 'center', gap: 6, minWidth: 64 },
});
