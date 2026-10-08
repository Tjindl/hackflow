import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActionBar } from './form/ActionBar';
import { Completion } from './form/Completion';
import { QuestionPanel } from './form/QuestionPanel';
import { QUESTIONS } from './form/questions';
import { useKeyboardShortcuts } from './form/useKeyboardShortcuts';
import { useRegistration } from './form/useRegistration';
import { DepthGauge } from './hud/DepthGauge';
import { FieldNotes } from './hud/FieldNotes';
import { Header } from './hud/Header';
import { StepControls } from './hud/StepControls';
import { Telemetry } from './hud/Telemetry';
import { usePrefersReducedMotion } from './lib/usePrefersReducedMotion';
import { createDescent } from './ocean/descent';
import { OceanBackground } from './ocean/OceanBackground';
import { waterColorsAt } from './ocean/palette';
import { levelAt } from './ocean/physics';
import type { OceanScene } from './ocean/renderer';
import { zonesForSteps } from './ocean/zones';
import styles from './App.module.css';

/** One stop per question, then the seafloor for the completion screen. */
const STOPS = zonesForSteps(QUESTIONS.length);

const positionOf = (index: number, step: number) =>
  index < step ? 'above' : index > step ? 'below' : 'current';

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const [descent] = useState(() => createDescent({ reducedMotion }));
  const scene = useMemo<OceanScene>(
    () => ({ descent, levelAt: (position) => levelAt(position, STOPS), floorPosition: QUESTIONS.length }),
    [descent],
  );

  const registration = useRegistration(QUESTIONS);
  const { step, answers, error, status, question } = registration;
  const complete = status === 'complete';
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => descent.setReducedMotion(reducedMotion), [descent, reducedMotion]);

  // Sink (or rise) to the current step. Panel transitions take their timing from the trip,
  // and focus moves to the new field straight away so typing never waits on the animation.
  useLayoutEffect(() => {
    const duration = descent.travelTo(step);
    if (duration > 0) root.current?.style.setProperty('--dive-duration', `${duration}ms`);
    root.current
      ?.querySelector<HTMLElement>('[data-position="current"] [data-autofocus]')
      ?.focus({ preventScroll: true });
  }, [descent, step]);

  // Mobile browser chrome follows the colour of the water.
  useEffect(() => {
    const color = waterColorsAt(STOPS[step].level).top;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, [step]);

  useKeyboardShortcuts(
    {
      onSubmit: registration.next,
      onLetter: (index) => {
        if (question?.type === 'choice' && index < question.options.length) {
          registration.setAnswer(question.options[index]);
        }
      },
    },
    !complete,
  );

  return (
    <div ref={root} className={styles.app}>
      <OceanBackground scene={scene} animate={!reducedMotion} />

      <Header step={step} total={QUESTIONS.length} complete={complete} />
      <Telemetry descent={descent} stops={STOPS} variant="strip" />
      <DepthGauge descent={descent} stops={STOPS} />
      <FieldNotes zone={STOPS[step]} />

      <main className={styles.stage}>
        {QUESTIONS.map((item, index) => (
          <section
            key={item.id}
            className={styles.panel}
            data-position={positionOf(index, step)}
            inert={index !== step}
          >
            <QuestionPanel
              question={item}
              index={index}
              value={answers[item.id] ?? ''}
              error={index === step ? error : null}
              isLast={index === QUESTIONS.length - 1}
              submitting={status === 'submitting'}
              onChange={registration.setAnswer}
              onNext={registration.next}
            />
          </section>
        ))}
        <section
          className={styles.panel}
          data-position={positionOf(QUESTIONS.length, step)}
          inert={!complete}
        >
          <Completion questions={QUESTIONS} answers={answers} onRestart={registration.reset} />
        </section>
      </main>

      <footer className={styles.footer}>
        <Telemetry descent={descent} stops={STOPS} variant="panel" />
        {!complete && (
          <StepControls
            canGoBack={step > 0}
            busy={status !== 'editing'}
            onBack={registration.back}
            onNext={registration.next}
          />
        )}
      </footer>

      {!complete && (
        <ActionBar
          canGoBack={step > 0}
          isLast={registration.isLast}
          submitting={status === 'submitting'}
          onBack={registration.back}
          onNext={registration.next}
        />
      )}
    </div>
  );
}
