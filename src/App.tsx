import { useState, useEffect } from 'react'
import './App.css'
// import { CiBookmark } from "react-icons/ci";

interface Scores {
  supports: number
  contradicts: number
  unclear: number
}

interface Article {
  link: string
  quote: string
  conclusion: string
}

interface Highlight {
  id: number // unique number for each new highlight
  sentence: string
  conclusion: string
  scores: Scores | null
  articles: Article[] // how do we want to represent articles, use extracted data
}

function App() {
  const [selectedText, setSelectedText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [relation, setRelation] = useState("");
  const [extractedQuote, setExtractedQuote] = useState("");
  const [scores, setScores] = useState<Scores | null>(null);
  // const [savedList, setSavedList] = useState<Highlight[]>([])
  const [currentHighlight, setCurrentHighlight] = useState<Highlight | null>(null)

  useEffect(() => {
    chrome.storage?.local.get("selectedText", (result) => {
      console.log(result.selectedText);
      if (result.selectedText) {
        const text = result.selectedText;
        setSelectedText(text)
        getQuery(text);  // call notebook
        getConclusion(text); // call notebook
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


  const getConclusion = async (text: string) => {
    try {
      const response = await fetch("http://localhost:8888/get_conclusion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ quote: text })
      });

      const data = await response.json();

      setRelation(data.relation || "unknown");
      setExtractedQuote(data.extractedQuote || "");
      setScores(data.scores || null);

      const newHighlight: Highlight = {
        id: Date.now(), // unique ID based on timestamp
        sentence: text,
        conclusion: relation,
        scores: scores,
        articles: [
          {
            link: "", // TODO when maddy's code is implemented
            quote: extractedQuote,
            conclusion: relation // TODO update when mult article conclusions are supported
          }
        ]
      };
      setCurrentHighlight(newHighlight)
      console.log(currentHighlight)
    } catch (error) {
      console.error("Error fetching conclusion:", error);
      setRelation("error");
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
      <h3 className="header">Fact-Check</h3>
      {/* <button className="save-button" onClick={() => toggleSaveHighlight(currentHighlight)}><CiBookmark /></button> */}
      <div className="highlight-section">
        {selectedText && <p><strong>Highlighted Sentence: </strong>{selectedText}</p>}
        {/* {searchQuery && <p>Search Query: {searchQuery}</p>} */}

        {relation && <p className="conclusion" data-status={relation}><strong>Conclusion:</strong> {relation}</p>}
        {extractedQuote && <p><strong>Extracted Sentence:</strong> “{extractedQuote}”</p>}
        {scores && (
          <div>
            <strong>Probabilities:</strong>
            <ul>
              <li>Supports: {scores.supports}</li>
              <li>Contradicts: {scores.contradicts}</li>
              <li>Unclear: {scores.unclear}</li>
            </ul>
          </div>)}
      </div>

    </div>
  )
}

export default App
