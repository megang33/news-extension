import { useState, useEffect } from 'react'
import './App.css'
// import { CiBookmark } from "react-icons/ci";

interface Highlight {
  id: number // unique number for each new highlight
  sentence: string
  conclusion: string
  articles: any[]
}

function App() {
  const [selectedText, setSelectedText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // const [savedList, setSavedList] = useState<Highlight[]>([])
  const [currentHighlight, setCurrentHighlight] = useState<Highlight | null>(null)
  // const [relation, setRelation] = useState("");
  // const [extractedQuote, setExtractedQuote] = useState("");
  // const [scores, setScores] = useState<{ supports: number; contradicts: number; unclear: number } | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [conclusion, setConclusion] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);


  useEffect(() => {
    chrome.storage?.local.get("selectedText", (result) => {
      console.log(result.selectedText);
      if (result.selectedText) {
        const text = result.selectedText;
        setSelectedText(text)
        getQuery(text);  // call notebook
        // getConclusion(text, "Hi everyone!"); // call notebook
        runFullPipeline(text); // fetch articles + fact-checking
      }
    });
  }, []);


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

      const newHighlight: Highlight = {
        id: Date.now(), // unique ID based on timestamp
        sentence: selectedText,
        conclusion: conclusion,
        articles: articles
      };
      setCurrentHighlight(newHighlight)
      console.log(currentHighlight)
    } catch (error) {
      console.error("Error running full pipeline:", error);
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

  // Save Function
  // const toggleSaveHighlight = (highlight: Highlight | null) => {
  //   if (highlight) {
  //     // if save checked
  //     setSavedList([...savedList, highlight])
  //     // else remove
  //     // setSavedList(savedList.filter((h) => h.id !== highlight.id));
  //   }
  // }

  return (
    <div className="layout">
      <h1>Fact-Checking</h1>
      <button onClick={() => { }}>
        Start Read
      </button>
      <div className="highlight-section">
        {selectedText && <p>{selectedText}</p>}
        {searchQuery && <p>Search Query: {searchQuery}</p>}

        {/*
      {relation && <p><strong>Conclusion:</strong> {relation}</p>}
      {extractedQuote && <p><strong>Extracted Sentence:</strong> “{extractedQuote}”</p>}
      {scores && (
        <div>
          <strong>Probabilities:</strong>
          <ul>
            <li>Supports: {scores.supports}</li>
            <li>Contradicts: {scores.contradicts}</li>
            <li>Unclear: {scores.unclear}</li>
          </ul>
        </div> )} */}

        {conclusion && <p className="conclusion" data-status={conclusion}><strong>Conclusion:</strong> {conclusion}</p>}
        {confidence !== null && <p><strong>Confidence:</strong> {Math.round(confidence * 100)}%</p>}

        {articles.length > 0 && (
          <div>
            <h3>Sources:</h3>
            <ul>
              {articles.map((article, index) => (
                <li key={index}>
                  <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
                  <p><strong>Conclusion: </strong> {article.fact_check.relation}</p>
                  <p><strong>Extracted Quote: </strong> {article.fact_check.extractedQuote}</p>
                  <p>
                    <strong>Scores: </strong>
                    {`Supports: ${article.fact_check.scores.supports}, Contradicts: ${article.fact_check.scores.contradicts}, Unclear: ${article.fact_check.scores.unclear}`}
                  </p>

                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

}

export default App;
