import { useSprings, animated } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';

// Function to properly split text that may contain emojis
const splitTextWithEmojis = (text) => {
  // This regex matches emojis and other characters
  const regex = /\p{Emoji}|\p{RI}|\p{Regional_Indicator}|\p{Emoji_Presentation}|[\u{1F1E6}-\u{1F1FF}]|\S/gu;
  
  // Split text into words first
  return text.split(' ').map(word => {
    // For each word, match the regex to capture individual characters and emojis
    const matches = [...word.matchAll(regex)];
    return matches.map(match => match[0]);
  });
};

const SplitText = ({
  text = '',
  className = '',
  delay = 100,
  animationFrom = { opacity: 0, transform: 'translate3d(0,40px,0)' },
  animationTo = { opacity: 1, transform: 'translate3d(0,0,0)' },
  easing = 'easeOutCubic',
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  onLetterAnimationComplete,
  style = {},
  onClick,
  onKeyPress,
  role,
  tabIndex,
  'aria-label': ariaLabel,
}) => {
  // Split the text into words and characters, handling emojis properly
  const words = splitTextWithEmojis(text);
  
  const letters = words.flat();
  const [inView, setInView] = useState(false);
  const ref = useRef();
  const animatedCount = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const springs = useSprings(
    letters.length,
    letters.map((_, i) => ({
      from: animationFrom,
      to: inView
        ? async (next) => {
          await next(animationTo);
          animatedCount.current += 1;
          if (animatedCount.current === letters.length && onLetterAnimationComplete) {
            onLetterAnimationComplete();
          }
        }
        : animationFrom,
      delay: i * delay,
      config: { 
        tension: 300, 
        friction: 20,
        easing: (t) => {
          // Custom easing functions
          switch (easing) {
            case 'easeOutQuad': return 1 - (1 - t) * (1 - t);
            case 'easeOutCubic': return 1 - Math.pow(1 - t, 3);
            case 'easeOutQuart': return 1 - Math.pow(1 - t, 4);
            case 'easeOutQuint': return 1 - Math.pow(1 - t, 5);
            default: return t;
          }
        }
      },
    }))
  );

  const baseStyle = { 
    textAlign, 
    overflow: 'hidden', 
    display: 'inline', 
    whiteSpace: 'normal', 
    wordWrap: 'break-word',
    ...style
  };

  // Add interactive props if provided
  const interactiveProps = {};
  if (onClick) interactiveProps.onClick = onClick;
  if (onKeyPress) interactiveProps.onKeyPress = onKeyPress;
  if (role) interactiveProps.role = role;
  if (tabIndex !== undefined) interactiveProps.tabIndex = tabIndex;
  if (ariaLabel) interactiveProps['aria-label'] = ariaLabel;

  return (
    <p
      ref={ref}
      className={`split-parent ${className}`}
      style={baseStyle}
      {...interactiveProps}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.map((letter, letterIndex) => {
            const index = words
              .slice(0, wordIndex)
              .reduce((acc, w) => acc + w.length, 0) + letterIndex;

            return (
              <animated.span
                key={index}
                style={{
                  ...springs[index],
                  display: 'inline-block',
                  willChange: 'transform, opacity',
                }}
              >
                {letter}
              </animated.span>
            );
          })}
          <span style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>
        </span>
      ))}
    </p>
  );
};

export default SplitText; 