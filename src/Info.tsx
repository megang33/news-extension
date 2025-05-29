import { useNavigate } from 'react-router-dom';
import './App.css';

function Info() {
    const navigate = useNavigate();
    return (
        <div>
            <p className='back-button info-link' onClick={() => navigate('/')}>Back</p>
            <div className='info-page layout'>
                <h1 className='header center'>How Our Fact Checker Works</h1>
                <p>
                    Our fact-checker is designed to help you assess the credibility of claims found in online articles. Here are the steps we use to make a conclusion:
                </p>
                <h4 className='subheader'> 1. Claim Detection </h4>
                <p>
                    When you highlight a piece of text in an article, we use that specific text as the claim to be fact-checked. We also take note of the article’s title to provide context.
                </p>
                <h4 className='subheader'> 2. Query Generation </h4>
                <p> 
                    Using natural language processing, we analyze the highlighted claim and the article title to identify key concepts, names, numbers, and topics. From this, we generate a focused search query that captures the essence of the claim.
                </p>
                <h4 className='subheader'> 3. Information Gathering </h4>
                <p> 
                    We run the query through Google’s Custom Search API to find a selection of recent and relevant articles from reputable sources. Our list of sources includes _.
                </p>
                <h4 className='subheader'> 4. Evidence Analysis </h4>
                <p>
                    Each article is examined using AI models trained on natural language inference (NLI). These models assess whether the article content supports, contradicts, or is unclear about the claim. We also use a question-answering model to extract a short quote from the article that best illustrates its conclusion.
                </p>
                <h4 className='subheader'> 5. Conclusion and Confidence </h4>
                <p>
                    Based on the combined evidence across multiple sources, we determine whether the overall conclusion is that the claim is supported, contradicted, or unclear. If the passage clearly supports or contradicts the claim, we display the short quote from the article that best demonstrates that conclusion for transparency. We also provide a confidence score, calculated as the average probability associated with the chosen conclusion, to indicate how strongly the evidence points in a particular direction.
                </p>
            </div>
        </div>
    )
}

export default Info