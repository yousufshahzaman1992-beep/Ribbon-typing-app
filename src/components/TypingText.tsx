import React, { useMemo } from 'react';

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'async', 'await', 
  'try', 'catch', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'default',
  'import', 'export', 'class', 'extends', 'new', 'this', 'throw', 'typeof'
]);

interface MappedSegment {
  text: string;
  startIndex: number; // global start index (inclusive)
  endIndex: number;   // global end index (exclusive)
}

interface MappedLine {
  segments: MappedSegment[];
}

interface MappedParagraph {
  lines: MappedLine[];
}

interface TypingTextProps {
  typedText: string;
  targetText: string;
  activeAppMode: string;
  punishedTokenIndex: number | null;
  parsedParagraphs: { lines: string[] }[];
  activeCharRef: React.RefObject<HTMLSpanElement | null>;
  mistypedNewlineIndices: Set<number>;
  autoInsertedBrackets: number[];
  ghostIndex: number;
  zenMode?: boolean;
  opponentIndex?: number;
  opponentType?: 'bot' | 'boss' | null;
}

const CursorStyles = () => (
  <style>{`
    span[data-ghost] {
      position: relative !important;
      background-color: rgba(99, 102, 241, 0.15) !important;
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.3) !important;
    }
    span[data-ghost]::after {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 2px !important;
      background-color: rgba(99, 102, 241, 0.85) !important;
      pointer-events: none !important;
    }
    span[data-boss] {
      position: relative !important;
      background-color: rgba(255, 107, 53, 0.15) !important;
      box-shadow: 0 0 8px rgba(255, 107, 53, 0.4) !important;
    }
    span[data-boss]::after {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 2px !important;
      background-color: #FF6B35 !important;
      pointer-events: none !important;
    }
    span[data-bot] {
      position: relative !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.4) !important;
    }
    span[data-bot]::after {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 2px !important;
      background-color: #FFFFFF !important;
      pointer-events: none !important;
    }
  `}</style>
);

interface CharSpanProps {
  segment: MappedSegment;
  isActive: boolean;
  isTyped: boolean;
  isCorrect: boolean;
  isNewlineMistake: boolean;
  isAutoBracket: boolean;
  isKeyword: boolean;
  isGhost: boolean;
  isOpponent: boolean;
  isBot: boolean;
  isBoss: boolean;
  isOpponentTyped: boolean;
  isPunished: boolean;
  zenMode: boolean;
  activeCharRef: React.RefObject<HTMLSpanElement | null>;
}

const CharSpanComponent: React.FC<CharSpanProps> = ({
  segment,
  isActive,
  isTyped,
  isCorrect,
  isNewlineMistake,
  isAutoBracket,
  isKeyword,
  isGhost,
  isOpponent,
  isBot,
  isBoss,
  isOpponentTyped,
  isPunished,
  zenMode,
  activeCharRef,
}) => {
  const char = segment.text;
  const isWhitespace = /^\s$/.test(char);
  let charClass = "";
  let charStyle: React.CSSProperties = {
    display: 'inline-block',
  };

  if (char === '\n') {
    if (isNewlineMistake) {
      charClass = "text-[var(--theme-error,#FF4444)] bg-[var(--theme-error-bg,rgba(255,68,68,0.15))] rounded-[4px] px-0.5 font-bold";
    } else if (isTyped) {
      charClass = "text-[var(--theme-correct,#45A29E)]";
    } else if (isActive) {
      charClass = "text-[var(--theme-cursor,#00F0FF)] font-black scale-110 relative z-10 animate-pulse";
      charStyle.textShadow = "0 0 10px var(--theme-cursor,#00F0FF), 0 0 20px var(--theme-cursor,#00F0FF)";
      charStyle.borderBottom = "2px solid var(--theme-cursor,#00F0FF)";
    } else {
      charClass = "text-zinc-600 font-bold opacity-60";
    }
  } else if (isWhitespace) {
    charStyle.minWidth = '10px';
    if (isTyped) {
      charClass = isCorrect 
        ? "text-[var(--theme-correct,#45A29E)]/60"
        : "bg-[var(--theme-error-bg,rgba(255,68,68,0.2))] text-[var(--theme-error,#FF4444)] rounded-[4px] px-0.5 font-bold";
    } else {
      charClass = "text-[var(--theme-text,#C5C6C7)]/50";
    }
  } else {
    if (isTyped) {
      charClass = isCorrect 
        ? (isAutoBracket ? "text-[var(--theme-cursor,#00F0FF)] font-semibold" : "text-[var(--theme-correct,#45A29E)]")
        : "text-[var(--theme-error,#FF4444)] bg-[var(--theme-error-bg,rgba(255,68,68,0.15))] rounded-[4px] px-0.5 underline decoration-[var(--theme-error,#FF4444)] font-bold";
    } else if (isActive) {
      charClass = "text-[var(--theme-cursor,#00F0FF)] font-black scale-110 relative z-10 animate-pulse";
      charStyle.textShadow = "0 0 10px var(--theme-cursor,#00F0FF), 0 0 20px var(--theme-cursor,#00F0FF)";
      charStyle.borderBottom = "2px solid var(--theme-cursor,#00F0FF)";
    } else if (isKeyword && !zenMode) {
      charClass = "text-[var(--theme-accent,#FF6B35)]/95 font-medium";
    } else {
      charClass = "text-[var(--theme-text,#C5C6C7)]";
    }
  }

  if (!isTyped && isOpponentTyped) {
    if (char === '\n') {
      charClass = "text-white opacity-80";
    } else if (isWhitespace) {
      charClass = "text-white/40";
    } else {
      charClass = "text-white font-bold transition-all";
    }
  }

  if (isPunished && !zenMode) {
    charClass += " blur-[1.5px] scale-95 skew-x-3 text-red-500/80 animate-pulse";
  }

  if (zenMode && !isTyped) {
    charStyle.opacity = 0;
  }

  return (
    <span 
      ref={isActive ? activeCharRef : null}
      className={charClass}
      style={charStyle}
      data-ghost={isGhost || undefined}
      data-bot={isBot || undefined}
      data-boss={isBoss || undefined}
    >
      {char === '\n' ? '↵' : (char === ' ' ? '\u00A0' : char)}
    </span>
  );
};

const CharSpan = React.memo(CharSpanComponent, (prev, next) => {
  return (
    prev.segment.text === next.segment.text &&
    prev.segment.startIndex === next.segment.startIndex &&
    prev.segment.endIndex === next.segment.endIndex &&
    prev.isActive === next.isActive &&
    prev.isTyped === next.isTyped &&
    prev.isCorrect === next.isCorrect &&
    prev.isNewlineMistake === next.isNewlineMistake &&
    prev.isAutoBracket === next.isAutoBracket &&
    prev.isKeyword === next.isKeyword &&
    prev.isGhost === next.isGhost &&
    prev.isOpponent === next.isOpponent &&
    prev.isBot === next.isBot &&
    prev.isBoss === next.isBoss &&
    prev.isOpponentTyped === next.isOpponentTyped &&
    prev.isPunished === next.isPunished &&
    prev.zenMode === next.zenMode
  );
});

const TypingTextComponent: React.FC<TypingTextProps> = ({
  typedText,
  targetText,
  activeAppMode,
  punishedTokenIndex,
  parsedParagraphs,
  activeCharRef,
  mistypedNewlineIndices,
  autoInsertedBrackets,
  ghostIndex,
  zenMode = false,
  opponentIndex = -1,
  opponentType = null,
}) => {

  const segmenter = useMemo(() => new Intl.Segmenter(undefined, { granularity: 'grapheme' }), []);

  // 1. Precompute special indices
  const keywordIndices = useMemo(() => {
    const indices = new Set<number>();
    if (activeAppMode === 'code') {
      const tokens = targetText.split(/(\s+)/);
      let idx = 0;
      for (const token of tokens) {
        const isKeyword = JS_KEYWORDS.has(token.trim());
        if (isKeyword) {
          for (let i = 0; i < token.length; i++) {
            indices.add(idx + i);
          }
        }
        idx += token.length;
      }
    }
    return indices;
  }, [targetText, activeAppMode]);

  const punishedIndices = useMemo(() => {
    const indices = new Set<number>();
    if (punishedTokenIndex !== null) {
      const tokens = targetText.split(/(\s+)/);
      let idx = 0;
      for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
        const token = tokens[tokenIdx];
        if (tokenIdx === punishedTokenIndex) {
          for (let i = 0; i < token.length; i++) {
            indices.add(idx + i);
          }
        }
        idx += token.length;
      }
    }
    return indices;
  }, [targetText, punishedTokenIndex]);

  // 2. Map paragraphs to lines of segments with globalIndex tracking
  const mappedParagraphs = useMemo(() => {
    const paragraphs: MappedParagraph[] = [];
    let globalIndexCounter = 0;

    for (const para of parsedParagraphs) {
      const lines: MappedLine[] = [];
      for (const lineText of para.lines) {
        const segments: MappedSegment[] = [];
        
        // Segment the line using Intl.Segmenter to preserve Hindi conjuncts/matras
        const parts = [...segmenter.segment(lineText)];
        for (const part of parts) {
          const segText = part.segment;
          const len = segText.length;
          segments.push({
            text: segText,
            startIndex: globalIndexCounter,
            endIndex: globalIndexCounter + len
          });
          globalIndexCounter += len;
        }
        
        // Every line ends with a \n character
        segments.push({
          text: '\n',
          startIndex: globalIndexCounter,
          endIndex: globalIndexCounter + 1
        });
        globalIndexCounter += 1;

        lines.push({ segments });
      }
      paragraphs.push({ lines });
    }
    return paragraphs;
  }, [parsedParagraphs, segmenter]);

  const autoBracketsSet = useMemo(() => new Set(autoInsertedBrackets), [autoInsertedBrackets]);

  // Flatten mappedParagraphs into a list of lines with precomputed word/space/newline chunks
  const flattenedLinesWithChunks = useMemo(() => {
    const list: {
      segments: MappedSegment[];
      paraIdx: number;
      lineIdx: number;
      isFirstInPara: boolean;
      chunks: { type: 'word' | 'space' | 'newline'; segments: MappedSegment[] }[];
    }[] = [];

    mappedParagraphs.forEach((para, paraIdx) => {
      para.lines.forEach((line, lineIdx) => {
        const chunks: { type: 'word' | 'space' | 'newline'; segments: MappedSegment[] }[] = [];
        let currentChunk: MappedSegment[] = [];
        let currentType: 'word' | 'space' | 'newline' | null = null;

        for (const seg of line.segments) {
          const text = seg.text;
          let type: 'word' | 'space' | 'newline';
          if (text === '\n') {
            type = 'newline';
          } else if (text === ' ') {
            type = 'space';
          } else {
            type = 'word';
          }

          if (currentType === null) {
            currentType = type;
            currentChunk.push(seg);
          } else if (currentType === type && type === 'word') {
            currentChunk.push(seg);
          } else {
            chunks.push({ type: currentType, segments: currentChunk });
            currentType = type;
            currentChunk = [seg];
          }
        }
        if (currentChunk.length > 0 && currentType !== null) {
          chunks.push({ type: currentType, segments: currentChunk });
        }

        list.push({
          segments: line.segments,
          paraIdx,
          lineIdx,
          isFirstInPara: lineIdx === 0,
          chunks
        });
      });
    });
    return list;
  }, [mappedParagraphs]);

  // Find activeLineIndex where the typing cursor currently resides
  const activeLineIndex = useMemo(() => {
    const activeGlobalIdx = typedText.length;
    for (let i = 0; i < flattenedLinesWithChunks.length; i++) {
      const line = flattenedLinesWithChunks[i];
      if (line.segments.length > 0) {
        const start = line.segments[0].startIndex;
        const end = line.segments[line.segments.length - 1].endIndex - 1;
        if (activeGlobalIdx >= start && activeGlobalIdx <= end) {
          return i;
        }
      }
    }
    return 0;
  }, [flattenedLinesWithChunks, typedText.length]);

  return (
    <div className="w-full flex flex-col gap-y-4 pb-16 select-none">
      <CursorStyles />
      {flattenedLinesWithChunks.map((line, index) => {
        const isParagraphStart = line.isFirstInPara && index > 0;

        // Check if this line is close to active line
        const isLineActiveOrAdjacent = Math.abs(index - activeLineIndex) <= 2;

        // Check if opponent is on this line
        let containsOpponent = false;
        if (opponentIndex !== undefined && opponentIndex >= 0 && line.segments.length > 0) {
          const start = line.segments[0].startIndex;
          const end = line.segments[line.segments.length - 1].endIndex - 1;
          if (opponentIndex >= start && opponentIndex <= end) {
            containsOpponent = true;
          }
        }

        // Check if ghost cursor is on this line
        let containsGhost = false;
        if (ghostIndex !== undefined && ghostIndex >= 0 && line.segments.length > 0) {
          const start = line.segments[0].startIndex;
          const end = line.segments[line.segments.length - 1].endIndex - 1;
          if (ghostIndex >= start && ghostIndex <= end) {
            containsGhost = true;
          }
        }

        const renderFullSpans = isLineActiveOrAdjacent || containsOpponent || containsGhost;

        if (!renderFullSpans) {
          // Render simplified fast text line
          const lineText = line.segments.map(s => s.text === '\n' ? '↵' : s.text).join('');
          const isPast = index < activeLineIndex;

          return (
            <div 
              key={index}
              id={`typing-line-flat-${index}`}
              className={`w-full text-left font-mono text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] leading-[1.65] tracking-wide whitespace-pre-wrap transition-all duration-75 ${
                isParagraphStart ? 'mt-5 pl-6' : line.isFirstInPara ? 'pl-6' : ''
              }`}
            >
              <span className={`${isPast ? "text-[var(--theme-correct,#45A29E)] opacity-55" : "text-[var(--theme-text,#C5C6C7)] opacity-40"} whitespace-pre-wrap`}>
                {lineText}
              </span>
            </div>
          );
        }

        return (
          <div 
            key={index}
            id={`typing-line-flat-${index}`}
            className={`w-full text-left font-mono text-[15px] sm:text-[16px] md:text-[17px] lg:text-[18px] leading-[1.65] tracking-wide text-zinc-400 flex flex-wrap gap-y-1 transition-all duration-75 ${
              isParagraphStart ? 'mt-5 pl-6' : line.isFirstInPara ? 'pl-6' : ''
            }`}
          >
            {line.chunks.map((chunk, chunkIdx) => {
              if (chunk.type === 'word') {
                return (
                  <span key={chunkIdx} className="inline-block" style={{ overflowWrap: 'break-word', wordBreak: 'keep-all', whiteSpace: 'nowrap' }}>
                    {chunk.segments.map((seg, charIdx) => {
                      const absoluteIndex = seg.startIndex;
                      const isTyped = absoluteIndex < typedText.length;
                      const isActive = typedText.length >= seg.startIndex && typedText.length < seg.endIndex;
                      
                      const typedPart = typedText.substring(seg.startIndex, Math.min(typedText.length, seg.endIndex));
                      const targetPart = targetText.substring(seg.startIndex, Math.min(typedText.length, seg.endIndex));
                      const isCorrect = zenMode ? true : (isTyped && typedPart === targetPart);
                      
                      const isNewlineMistake = zenMode ? false : mistypedNewlineIndices.has(absoluteIndex);
                      const isAutoBracket = activeAppMode === 'code' && autoBracketsSet.has(absoluteIndex);
                      const isKeyword = keywordIndices.has(absoluteIndex);
                      
                      const isGhost = ghostIndex >= seg.startIndex && ghostIndex < seg.endIndex;
                      const isOpponent = opponentIndex !== undefined && opponentIndex >= seg.startIndex && opponentIndex < seg.endIndex;
                      const isBot = isOpponent && opponentType === 'bot';
                      const isBoss = isOpponent && opponentType === 'boss';
                      const isOpponentTyped = opponentIndex !== undefined && opponentIndex > seg.startIndex;
                      const isPunished = punishedIndices.has(absoluteIndex);

                      return (
                        <CharSpan
                          key={charIdx}
                          segment={seg}
                          isActive={isActive}
                          isTyped={isTyped}
                          isCorrect={isCorrect}
                          isNewlineMistake={isNewlineMistake}
                          isAutoBracket={isAutoBracket}
                          isKeyword={isKeyword}
                          isGhost={isGhost}
                          isOpponent={isOpponent}
                          isBot={isBot}
                          isBoss={isBoss}
                          isOpponentTyped={isOpponentTyped}
                          isPunished={isPunished}
                          zenMode={zenMode}
                          activeCharRef={activeCharRef}
                        />
                      );
                    })}
                  </span>
                );
              } else {
                return chunk.segments.map((seg, charIdx) => {
                  const absoluteIndex = seg.startIndex;
                  const isTyped = absoluteIndex < typedText.length;
                  const isActive = typedText.length >= seg.startIndex && typedText.length < seg.endIndex;
                  
                  const typedPart = typedText.substring(seg.startIndex, Math.min(typedText.length, seg.endIndex));
                  const targetPart = targetText.substring(seg.startIndex, Math.min(typedText.length, seg.endIndex));
                  const isCorrect = zenMode ? true : (isTyped && typedPart === targetPart);
                  
                  const isNewlineMistake = zenMode ? false : mistypedNewlineIndices.has(absoluteIndex);
                  const isAutoBracket = activeAppMode === 'code' && autoBracketsSet.has(absoluteIndex);
                  const isKeyword = keywordIndices.has(absoluteIndex);
                  
                  const isGhost = ghostIndex >= seg.startIndex && ghostIndex < seg.endIndex;
                  const isOpponent = opponentIndex !== undefined && opponentIndex >= seg.startIndex && opponentIndex < seg.endIndex;
                  const isBot = isOpponent && opponentType === 'bot';
                  const isBoss = isOpponent && opponentType === 'boss';
                  const isOpponentTyped = opponentIndex !== undefined && opponentIndex > seg.startIndex;
                  const isPunished = punishedIndices.has(absoluteIndex);

                  return (
                    <CharSpan
                      key={charIdx}
                      segment={seg}
                      isActive={isActive}
                      isTyped={isTyped}
                      isCorrect={isCorrect}
                      isNewlineMistake={isNewlineMistake}
                      isAutoBracket={isAutoBracket}
                      isKeyword={isKeyword}
                      isGhost={isGhost}
                      isOpponent={isOpponent}
                      isBot={isBot}
                      isBoss={isBoss}
                      isOpponentTyped={isOpponentTyped}
                      isPunished={isPunished}
                      zenMode={zenMode}
                      activeCharRef={activeCharRef}
                    />
                  );
                });
              }
            })}
          </div>
        );
      })}
    </div>
  );
};

export const GhostCursor = React.memo(({ active }: { active: boolean }) => null);
export const BossCursor = React.memo(({ active }: { active: boolean }) => null);
export const BotCursor = React.memo(({ active }: { active: boolean }) => null);

export const TypingText = React.memo(TypingTextComponent, (prevProps, nextProps) => {
  return (
    prevProps.typedText === nextProps.typedText &&
    prevProps.targetText === nextProps.targetText &&
    prevProps.activeAppMode === nextProps.activeAppMode &&
    prevProps.punishedTokenIndex === nextProps.punishedTokenIndex &&
    prevProps.parsedParagraphs === nextProps.parsedParagraphs &&
    prevProps.ghostIndex === nextProps.ghostIndex &&
    prevProps.autoInsertedBrackets === nextProps.autoInsertedBrackets &&
    prevProps.mistypedNewlineIndices === nextProps.mistypedNewlineIndices &&
    prevProps.zenMode === nextProps.zenMode &&
    prevProps.opponentIndex === nextProps.opponentIndex &&
    prevProps.opponentType === nextProps.opponentType
  );
});
