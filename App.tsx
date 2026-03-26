/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { streamDefinition, generateAsciiArt, AsciiArtData } from './services/geminiService';
import ContentDisplay from './components/ContentDisplay';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import AsciiArtDisplay from './components/AsciiArtDisplay';

// A curated list of portfolio-related skills and qualifications.
const PREDEFINED_WORDS = [
  'React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API', 'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure', 'Firebase', 'CI/CD', 'Git', 'Agile', 'Scrum', 'System Design', 'UI/UX Design', 'Figma', 'Responsive Design', 'Accessibility', 'Unit Testing', 'Integration Testing', 'Performance Optimization', 'SEO', 'Web Vitals', 'Microservices', 'Serverless', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Machine Learning', 'Data Visualization', 'D3.js', 'Three.js', 'WebSockets', 'OAuth', 'JWT', 'Redis', 'Elasticsearch', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'Vercel'
];
const UNIQUE_WORDS = [...new Set(PREDEFINED_WORDS)];


/**
 * Creates a simple ASCII art bounding box as a fallback.
 * @param topic The text to display inside the box.
 * @returns An AsciiArtData object with the generated art.
 */
const createFallbackArt = (topic: string): AsciiArtData => {
  const displayableTopic = topic.length > 20 ? topic.substring(0, 17) + '...' : topic;
  const paddedTopic = ` ${displayableTopic} `;
  const topBorder = `┌${'─'.repeat(paddedTopic.length)}┐`;
  const middle = `│${paddedTopic}│`;
  const bottomBorder = `└${'─'.repeat(paddedTopic.length)}┘`;
  return {
    art: `${topBorder}\n${middle}\n${bottomBorder}`
  };
};

const App: React.FC = () => {
  const [currentTopic, setCurrentTopic] = useState<string>('Full-Stack Development');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<AsciiArtData | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);


  useEffect(() => {
    if (!currentTopic) return;

    let isCancelled = false;

    const fetchContentAndArt = async () => {
      // Set initial state for a clean page load
      setIsLoading(true);
      setError(null);
      setContent(''); // Clear previous content immediately
      setAsciiArt(null);
      setGenerationTime(null);
      const startTime = performance.now();

      // Kick off ASCII art generation, but don't wait for it.
      // It will appear when it's ready, without blocking the definition.
      generateAsciiArt(currentTopic)
        .then(art => {
          if (!isCancelled) {
            setAsciiArt(art);
          }
        })
        .catch(err => {
          if (!isCancelled) {
            console.error("Failed to generate ASCII art:", err);
            // Generate a simple fallback ASCII art box on failure
            const fallbackArt = createFallbackArt(currentTopic);
            setAsciiArt(fallbackArt);
          }
        });

      let accumulatedContent = '';
      try {
        for await (const chunk of streamDefinition(currentTopic)) {
          if (isCancelled) break;
          
          if (chunk.startsWith('Error:')) {
            throw new Error(chunk);
          }
          accumulatedContent += chunk;
          if (!isCancelled) {
            setContent(accumulatedContent);
          }
        }
      } catch (e: unknown) {
        if (!isCancelled) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          setError(errorMessage);
          setContent(''); // Ensure content is clear on error
          console.error(e);
        }
      } finally {
        if (!isCancelled) {
          const endTime = performance.now();
          setGenerationTime(endTime - startTime);
          setIsLoading(false);
        }
      }
    };

    fetchContentAndArt();
    
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopic]);

  const handleWordClick = useCallback((word: string) => {
    const newTopic = word.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      setCurrentTopic(newTopic);
    }
  }, [currentTopic]);

  const handleSearch = useCallback((topic: string) => {
    const newTopic = topic.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      setCurrentTopic(newTopic);
    }
  }, [currentTopic]);

  const handleRandom = useCallback(() => {
    setIsLoading(true); // Disable UI immediately
    setError(null);
    setContent('');
    setAsciiArt(null);

    const randomIndex = Math.floor(Math.random() * UNIQUE_WORDS.length);
    const randomWord = UNIQUE_WORDS[randomIndex];

    // Prevent picking the same word twice in a row
    if (randomWord.toLowerCase() === currentTopic.toLowerCase()) {
      const nextIndex = (randomIndex + 1) % UNIQUE_WORDS.length;
      setCurrentTopic(UNIQUE_WORDS[nextIndex]);
    } else {
      setCurrentTopic(randomWord);
    }
  }, [currentTopic]);


  return (
    <div>
      <SearchBar onSearch={handleSearch} onRandom={handleRandom} isLoading={isLoading} />
      
      <header id="header-1" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 id="title-1" style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          PORTFOLIO WIKI
        </h1>
        <AsciiArtDisplay artData={asciiArt} topic={currentTopic} />
      </header>
      
      <main id="main-content-1">
        <div>
          <h2 id="header-2" style={{ marginBottom: '2rem', textTransform: 'capitalize' }}>
            {currentTopic}
          </h2>

          {error && (
            <div id="error-1" style={{ border: '1px solid #cc0000', padding: '1rem', color: '#cc0000' }}>
              <p style={{ margin: 0 }}>An Error Occurred</p>
              <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {/* Show skeleton loader when loading and no content is yet available */}
          {isLoading && content.length === 0 && !error && (
            <LoadingSkeleton />
          )}

          {/* Show content as it streams or when it's interactive */}
          {content.length > 0 && !error && (
             <ContentDisplay 
               content={content} 
               isLoading={isLoading} 
               onWordClick={handleWordClick} 
             />
          )}

          {/* Show empty state if fetch completes with no content and is not loading */}
          {!isLoading && !error && content.length === 0 && (
            <div id="empty-state-1" style={{ color: '#888', padding: '2rem 0' }}>
              <p>Content could not be generated.</p>
            </div>
          )}
        </div>
      </main>

      <footer id="footer-1" className="sticky-footer">
        <p id="footer-text-1" className="footer-text" style={{ margin: 0 }}>
          <span id="footer-item-1">Portfolio Wiki &copy; 2026</span> | 
          <a id="footer-link-1" href="https://github.com" target="_blank" rel="noopener noreferrer"> GitHub</a> | 
          <a id="footer-link-2" href="https://linkedin.com" target="_blank" rel="noopener noreferrer"> LinkedIn</a>
          {generationTime && <span id="generation-time-1"> · {Math.round(generationTime)}ms</span>}
        </p>
      </footer>
    </div>
  );
};

export default App;
