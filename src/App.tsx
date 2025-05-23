import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [selectedText, setSelectedText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // const [relation, setRelation] = useState("");
  // const [extractedQuote, setExtractedQuote] = useState("");
  // const [scores, setScores] = useState<{ supports: number; contradicts: number; unclear: number } | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [conclusion, setConclusion] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    chrome.storage?.local.get("selectedText", (result) => {
      console.log(result.selectedText);
      if (result.selectedText) {
        const text = result.selectedText;
        setSelectedText(text);
        getQuery(text);
        runFullPipeline(text);
      }
    });
  }, []);

  // Testing Only
  // useEffect(() => {
  //   const mockConclusion = "unclear";
  //   const mockConfidence = 0.9;
  //   const mockArticles = [
  //     {
  //       title: "Trump's agenda faces crucial stretch with House Republicans",
  //       link: "https://example.com/article1",
  //       fact_check: {
  //         relation: "unclear",
  //         extractedQuote: "generated quote which may span more than one line hopefully???",
  //         scores: {
  //           supports: 0,
  //           contradicts: 0,
  //           unclear: 1
  //         }
  //       }
  //     },
  //     {
  //       title: "Trump backs House's approach to budget plans to implement his...",
  //       link: "https://example.com/article2",
  //       fact_check: {
  //         relation: "contradicts",
  //         extractedQuote: "generated quote which may span more than one line hopefully???",
  //         scores: {
  //           supports: 0,
  //           contradicts: 0.88,
  //           unclear: 0.11
  //         }
  //       }
  //     },
  //     {
  //       title: "Senate Republicans pass budget blueprint after all-night session...",
  //       link: "https://example.com/article3",
  //       fact_check: {
  //         relation: "supports",
  //         extractedQuote: "generated quote which may span more than one line hopefully???",
  //         scores: {
  //           supports: 0.6,
  //           contradicts: 0.01,
  //           unclear: 0.39
  //         }
  //       }
  //     }
  //   ];

  //   // set the mock test state
  //   setConclusion(mockConclusion);
  //   setConfidence(mockConfidence);
  //   setArticles(mockArticles);
  // }, []);


  const getQuery = async (text: string) => {
    try {
      const response = await fetch("http://localhost:8888/generate_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      const query = data.query || "";
      setSearchQuery(query);
      console.log("Generated Query:", query);
      console.log(searchQuery) // so react doesn't complain
    } catch (error) {
      console.error("Error generating query:", error);
    }
  };

  // const getConclusion = async (text: string, passage: string) => {
  //   try {
  //     const response = await fetch("http://localhost:8888/get_conclusion", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({ 
  //         quote: text,
  //         passage: passage  // or pass a different value for 'passage' if needed
  //       })      
  //     });

  //     const data = await response.json();

  //     setRelation(data.relation || "unknown");
  //     setExtractedQuote(data.extractedQuote || "");
  //     setScores(data.scores || null);
  //   } catch (error) {
  //     console.error("Error fetching conclusion:", error);
  //     setRelation("error");
  //   }
  // };

  const runFullPipeline = async (claim: string) => {
    console.log("Running Pipeline")
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8888/search_and_check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ claim })
      });

      const data = await response.json();
      console.log("Full pipeline response:", data);
      setArticles(data.results || []);
      determineConclusion(data.results || []);

    } catch (error) {
      console.error("Error running full pipeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const determineConclusion = (articles: any[]) => {
    const supportScores: number[] = [];
    const contradictScores: number[] = [];
    const unclearScores: number[] = [];

    articles.forEach((article) => {
      const scores = article.fact_check.scores;
      supportScores.push(scores.supports);
      contradictScores.push(scores.contradicts);
      unclearScores.push(scores.unclear);
    });

    const avgSupport = supportScores.reduce((acc, score) => acc + score, 0) / supportScores.length;
    const avgContradict = contradictScores.reduce((acc, score) => acc + score, 0) / contradictScores.length;
    const avgUnclear = unclearScores.reduce((acc, score) => acc + score, 0) / unclearScores.length;

    if (avgSupport > avgContradict && avgSupport > avgUnclear) {
      setConclusion("Supports");
      setConfidence(avgSupport);
    } else if (avgContradict > avgSupport && avgContradict > avgUnclear) {
      setConclusion("Contradicts");
      setConfidence(avgContradict);
    } else {
      setConclusion("Unclear");
      setConfidence(avgUnclear);
    }
  };

  return (
    <div className="layout">
      <h2 className="header">Fact-Checker</h2>
      <div className="highlight-section">
        {selectedText &&
          <div className="statement-section">
            <p className="statement-title">{'\u{1f4a1}'} Statement Under Review</p>
            <p className="statement-body">{selectedText}</p>
          </div>}
        {loading && (
          <div className="loading-indicator">
            <p>Fact-checking across trusted sources...</p>
            <div className="spinner"></div>
          </div>)}
        <div className="conclusion-section">
          {conclusion && <p>Conclusion: <span className="conclusion" data-status={conclusion}>{conclusion}</span> {confidence !== null && <span>| {Math.round(confidence * 100)}% Confidence</span>}</p>}
        </div>
        {articles.length > 0 && (
          <div className="article-section">
            <h3>Evidence</h3>
            <ol>
              {articles.map((article, index) => (
                <li key={index} className="article-item">
                  <div className="article-heading">
                    <a className="article-title" href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
                    <p className="article-conclusion" data-status={article.fact_check.relation}>{(() => {
                      const scores = article.fact_check.scores;
                      const maxScore = Math.max(scores.supports, scores.contradicts, scores.unclear);
                      if (maxScore === scores.supports) return `${(maxScore * 100).toFixed(0)}%`;
                      if (maxScore === scores.contradicts) return `${(maxScore * 100).toFixed(0)}%`;
                      return `${(maxScore * 100).toFixed(0)}%`;
                    })()}</p>
                  </div>
                  <p className="article-quote">↪ "{article.fact_check.extractedQuote}"</p>
                  <div className="divider"></div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );

}

export default App;
