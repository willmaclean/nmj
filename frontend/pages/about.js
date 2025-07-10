import Link from 'next/link';

export default function About() {
  return (
    <div className="container">
      <nav className="nav">
        <Link href="/">
          <a className="nav-link">← Back to Game</a>
        </Link>
      </nav>

      <main className="main">
        <h1 className="title">About No More Jockeys</h1>
        
        <div className="content">
          <p>
            Parlour word games have become a compact arena for studying how large language models behave when they must balance factual recall, inference, memory and social tact. Researchers have begun to treat these apparently frivolous settings as controlled probes of theory-of-mind and alignment because the games demand cooperative reasoning but still yield quantitative records of every move. The contrast between solid linguistic ability and brittle social-pragmatic judgement that emerged in early attempts to make models play Codenames first revealed the opportunity: giving a clue is easy; anticipating how a partner will read it is not (<a href="https://www.axios.com/2019/10/05/codenames-ai-word-games?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[Axios]</a>).
          </p>

          <p>
            Codenames itself is now a formal benchmark. A December 2024 study frames both clue-giver and guesser roles as alternating inference tasks over a shared latent board, showing that models need to weigh semantic proximity against the risk of misleading their teammate. The authors report that GPT-4-class systems approach human-level success only when they externalise their chain-of-thought and prune it for relevance, whereas smaller open-weight models plateau well below that mark, exposing scaling limits in pragmatic reasoning (<a href="https://arxiv.org/html/2412.11373v2?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[arXiv]</a>).
          </p>

          <p>
            Entity-guessing games such as "20 Questions" push models from associative recall toward multi-turn planning. An ACL 2024 paper demonstrates that state-of-the-art LLMs can outperform average human players when they are allowed to reason step-by-step, but their accuracy collapses once the answer set expands beyond common nouns or when the context window is artificially shortened. The authors conclude that long-horizon strategy still relies on brittle contextual memory rather than a stable internal plan (<a href="https://aclanthology.org/2024.acl-long.82/?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[ACL Anthology]</a>).
          </p>

          <p>
            Social-deduction games extend the challenge by adding deception and partial observability. The WereWolf-Plus platform, released in June 2025, tests how agents bluff, accuse and vote under hidden roles. Results show that models generate fluent narratives but often reveal private information through over-explanation; tuning the objective function to control win-rate improves entertainment value but not robustness to adversarial dialogue (<a href="https://arxiv.org/pdf/2506.12841?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[arXiv]</a>). Parallel work on MaKTO-Werewolf confirms that strategic adaptation across rounds remains fragile (<a href="https://reneeye.github.io/MaKTO.html?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[reneeye.github.io]</a>).
          </p>

          <p>
            When several agents play without humans, they start to invent conventions. A Science Advances study published in May 2025 found that groups of GPT-derived agents rewarded for agreeing on labels spontaneously converged on shared nicknames and even exhibited group biases, an outcome the authors link to natural language evolution and to safety risks in multi-agent deployments (<a href="https://www.theguardian.com/technology/2025/may/14/ai-can-spontaneously-develop-human-like-communication-study-finds?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[The Guardian]</a>).
          </p>

          <p>
            Collaboration-first settings have also appeared. ImprovMate, introduced in July 2025, feeds live narrative prompts to human improvisers while a companion model tracks continuity. Laboratory evaluations report higher perceived flow than with human prompters, yet audiences still notice tonal drift when the model fails to infer the room's mood (<a href="https://research.adobe.com/publication/improvmate-multimodal-ai-assistant-for-improv-actor-training/?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[Adobe Research]</a>). Such results emphasise that subjective enjoyment, not merely task completion, is the binding constraint in parlour contexts.
          </p>

          <p>
            No More Jockeys crystallises many of these themes. Each turn requires encyclopaedic recall, ad-hoc taxonomy and rolling verification against an ever-growing set of categories. An AI prototype unveiled during Google's 2025 Gemini developer competition shows that LLMs can propose legal names at speed, reject illegal ones and even generate chatty commentary, but their success still hinges on holding dozens of open constraints in working memory without resorting to pedantic play that ruins the atmosphere (<a href="https://ai.google.dev/competition/projects/no-more-jockeys-training-game?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">[Google AI]</a>). Because every move comes with a natural-language justification, the game offers an unusually transparent test-bed for explanations: a model must state why its challenge is valid or why a name is safe, so factual accuracy and rhetorical politeness can be scored simultaneously.
          </p>

          <p>
            Taken together, these studies demonstrate that parlour games compress the core questions of artificial social intelligence into digestible rounds. They expose gaps between semantic proficiency and pragmatic restraint, reveal how memory limits translate into strategic errors and allow direct measurement of human satisfaction alongside win-rates. An agent that can keep Codenames fun, steer a Werewolf debate without dominating it and sustain witty yet accurate play in No More Jockeys would mark tangible progress toward language models that participate in, rather than merely observe, the informal rituals that structure human interaction.
          </p>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #f5f5f5;
          color: #333;
        }

        .nav {
          margin-bottom: 2rem;
        }

        .nav-link {
          color: #0066cc;
          text-decoration: none;
          font-size: 1rem;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #0052cc;
          text-decoration: underline;
        }

        .main {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 3rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .title {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          color: #1a1a1a;
          text-align: center;
        }

        .content {
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .content p {
          margin-bottom: 1.5rem;
          text-align: justify;
        }

        .content a {
          color: #0066cc;
          text-decoration: none;
          transition: color 0.2s;
        }

        .content a:hover {
          color: #0052cc;
          text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
          .container {
            background-color: #1a1a1a;
            color: #e0e0e0;
          }

          .main {
            background: #2a2a2a;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          }

          .title {
            color: #f0f0f0;
          }

          .nav-link {
            color: #66b3ff;
          }

          .nav-link:hover {
            color: #99ccff;
          }

          .content a {
            color: #66b3ff;
          }

          .content a:hover {
            color: #99ccff;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .main {
            padding: 2rem;
          }

          .title {
            font-size: 2rem;
          }

          .content {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .main {
            padding: 1.5rem;
          }

          .title {
            font-size: 1.75rem;
          }

          .content {
            font-size: 0.95rem;
            line-height: 1.7;
          }

          .content p {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}