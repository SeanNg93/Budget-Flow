import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'

const styles = {
  wrapper: {
    display: 'inline-block',
    whiteSpace: 'pre-wrap',
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    border: 0,
  },
}

/**
 * DecryptedText
 *
 * Props:
 * - text: string
 * - speed?: number
 * - maxIterations?: number
 * - sequential?: boolean
 * - revealDirection?: "start" | "end" | "center"
 * - useOriginalCharsOnly?: boolean
 * - characters?: string
 * - className?: string          (applied to revealed/normal letters)
 * - parentClassName?: string    (applied to parent span)
 * - encryptedClassName?: string (applied to encrypted letters)
 * - animateOn?: "view" | "hover"  (default: "hover")
 */
export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  ...props
}) {
  const [displayText, setDisplayText] = useState(text)
  const [isHovering, setIsHovering] = useState(false)
  const [isScrambling, setIsScrambling] = useState(false)
  const [revealedIndices, setRevealedIndices] = useState(new Set())
  const [hasAnimated, setHasAnimated] = useState(false) // for "view" mode
  const containerRef = useRef(null)
  const intervalRef = useRef(null)
  const iterationCountRef = useRef(0)
  const prevTextRef = useRef(text)

  // Reset animation state when text changes (e.g., when language changes)
  useEffect(() => {
    if (prevTextRef.current !== text) {
      setHasAnimated(false)
      setIsHovering(false)
      setRevealedIndices(new Set())
      setDisplayText(text)
      
      // If animateOn is "view" and element is already in view,
      // we need to manually trigger animation
      if (animateOn === 'view' && containerRef.current) {
        const isInView = () => {
          const rect = containerRef.current.getBoundingClientRect()
          return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
          )
        }
        
        if (isInView()) {
          // Short delay to ensure component is fully re-rendered
          setTimeout(() => {
            setIsHovering(true)
          }, 50)
        }
      }
      
      prevTextRef.current = text
    }
  }, [text, animateOn])

  // Memoize the available characters to avoid recalculating
  const availableChars = useMemo(() => {
    if (useOriginalCharsOnly) {
      return Array.from(new Set(text.split(''))).filter((char) => char !== ' ')
    }
    return characters.split('')
  }, [text, characters, useOriginalCharsOnly])

  // Get the next index to reveal based on direction
  const getNextIndex = useCallback((revealedSet) => {
    const textLength = text.length
    switch (revealDirection) {
      case 'start':
        return revealedSet.size
      case 'end':
        return textLength - 1 - revealedSet.size
      case 'center': {
        const middle = Math.floor(textLength / 2)
        const offset = Math.floor(revealedSet.size / 2)
        const nextIndex =
          revealedSet.size % 2 === 0
            ? middle + offset
            : middle - offset - 1

        if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
          return nextIndex
        }

        // Find the first unrevealed index if the calculated one isn't valid
        for (let i = 0; i < textLength; i++) {
          if (!revealedSet.has(i)) return i
        }
        return 0
      }
      default:
        return revealedSet.size
    }
  }, [text.length, revealDirection])

  // Shuffle text with revealed characters unchanged
  const shuffleText = useCallback((originalText, currentRevealed) => {
    if (useOriginalCharsOnly) {
      const positions = originalText.split('').map((char, i) => ({
        char,
        isSpace: char === ' ',
        index: i,
        isRevealed: currentRevealed.has(i),
      }))

      const nonSpaceChars = positions
        .filter((p) => !p.isSpace && !p.isRevealed)
        .map((p) => p.char)

      // Fisher-Yates shuffle for non-space, non-revealed characters
      for (let i = nonSpaceChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        [nonSpaceChars[i], nonSpaceChars[j]] = [nonSpaceChars[j], nonSpaceChars[i]]
      }

      let charIndex = 0
      return positions
        .map((p) => {
          if (p.isSpace) return ' '
          if (p.isRevealed) return originalText[p.index]
          return nonSpaceChars[charIndex++]
        })
        .join('')
    } else {
      return originalText
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' '
          if (currentRevealed.has(i)) return originalText[i]
          return availableChars[Math.floor(Math.random() * availableChars.length)]
        })
        .join('')
    }
  }, [availableChars, useOriginalCharsOnly])

  // Start or stop animation based on hover state
  useEffect(() => {
    // Clean up any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    iterationCountRef.current = 0

    if (isHovering) {
      setIsScrambling(true)
      
      intervalRef.current = setInterval(() => {
        setRevealedIndices((prevRevealed) => {
          if (sequential) {
            // Sequential mode - reveal one character at a time
            if (prevRevealed.size < text.length) {
              const nextIndex = getNextIndex(prevRevealed)
              const newRevealed = new Set(prevRevealed)
              newRevealed.add(nextIndex)
              setDisplayText(shuffleText(text, newRevealed))
              return newRevealed
            } else {
              // All characters revealed
              clearInterval(intervalRef.current)
              intervalRef.current = null
              setIsScrambling(false)
              return prevRevealed
            }
          } else {
            // Random scramble mode - scramble for maxIterations
            setDisplayText(shuffleText(text, prevRevealed))
            iterationCountRef.current++
            
            if (iterationCountRef.current >= maxIterations) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
              setIsScrambling(false)
              setDisplayText(text)
            }
            
            return prevRevealed
          }
        })
      }, speed)
    } else {
      // Reset when not hovering
      setDisplayText(text)
      setRevealedIndices(new Set())
      setIsScrambling(false)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [
    isHovering,
    text,
    speed,
    maxIterations,
    sequential,
    getNextIndex,
    shuffleText,
  ])

  // Setup intersection observer for 'view' trigger mode
  useEffect(() => {
    if (animateOn !== 'view') return

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsHovering(true) // trigger the decryption
          setHasAnimated(true) // ensure it runs only once
        }
      })
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    const currentRef = containerRef.current
    
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [animateOn, hasAnimated])

  // Event handlers for hover mode
  const hoverProps = useMemo(() => {
    if (animateOn === 'hover') {
      return {
        onMouseEnter: () => setIsHovering(true),
        onMouseLeave: () => setIsHovering(false),
        onFocus: () => setIsHovering(true),
        onBlur: () => setIsHovering(false),
      }
    }
    return {}
  }, [animateOn])

  // Enhanced keyboard handling
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsHovering(prev => !prev)
    }
  }, [])

  return (
    <motion.span 
      className={parentClassName} 
      ref={containerRef} 
      style={styles.wrapper} 
      tabIndex={animateOn === 'hover' ? 0 : -1}
      role={animateOn === 'hover' ? 'button' : undefined}
      aria-label={animateOn === 'hover' ? `Animate text: ${text}` : undefined}
      onKeyDown={animateOn === 'hover' ? handleKeyDown : undefined}
      {...hoverProps} 
      {...props}
    >
      <span style={styles.srOnly}>{text}</span>

      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const isRevealedOrDone =
            revealedIndices.has(index) || !isScrambling || !isHovering

          return (
            <span
              key={index}
              className={isRevealedOrDone ? className : encryptedClassName}
            >
              {char}
            </span>
          )
        })}
      </span>
    </motion.span>
  )
} 