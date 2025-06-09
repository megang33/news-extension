# Fact-Checking News Extension

Our system, FactCheckr, is a Google Chrome extension designed to fact-check text directly within a user’s browsing experience. When a user highlights a piece of text on an online news article and selects “Fact Check” from the right-click context menu, the extension activates. A side panel then opens, displaying a conclusion about whether the highlighted claim is widely supported or contradicted. This conclusion is backed by multiple relevant articles drawn from a curated set of large news sources. For each article, the system presents a summary of what it says about the highlighted claim, along with a confidence score indicating the article’s reliability and relevance. An overall confidence rating is also provided to help the user gauge how strongly the evidence supports the conclusion. To ensure transparency, the system includes an informational page that outlines the full pipeline, from how sources are selected, to how evidence is gathered and evaluated, to how conclusions are generated. This setup supports a realistic end-to-end scenario where a user encounters a questionable claim, activates the tool, and receives a clear, evidence-based assessment within seconds.

![image info](./CS%20188%20Poster_%20News%20FactCheckr.png)

## Set up

1. Clone the repository
    ```sh
        git clone https://github.com/megang33/news-extension
        cd news-extension
    ```
2. Install the dependencies:

    ```sh
    npm install
    ```
3. Create a Production Build
    ```sh
    npm run build
    ```
4. Setup LLM server in a virtual environment:
    ```sh
    ./setup.sh
    source venv/bin/activate
    python run_llm_server.py
    ```
5. Add extension to Chrome: see "Load extension in Chrome"

## How to Use (Interaction Flow)
1. Find a quote in an article that you're interested in.
2. Highlight the quote and right click. In the context menu, choose this extension.
3. In the side panel, the conclusion and sources will be shown. You can click on sources to learn more, save the quote, or close the panel.

## Development

To start the development server:

```sh
npm run dev
```

This will start the Vite development server and open your default browser. This shows you what the extension panel looks like.

## Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" using the toggle switch in the top right corner.
3. Click "Load unpacked" and select the `build` directory.

Your React app should now be loaded as a Chrome extension!

## Project Structure

- `public/`: Contains static files and the `manifest.json`.
- `src/`: Contains the React app source code.
- `vite.config.ts`: Vite configuration file.
- `tsconfig.json`: TypeScript configuration file.
- `package.json`: Contains the project dependencies and scripts.

## Icon PNG
Found at: /public/assets/fact_icon.png

## License

This project is licensed under the MIT License.
