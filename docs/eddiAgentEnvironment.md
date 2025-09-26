I am building a comprehensive multi-agent system. I want you to do research and suggest the best way my agents should interact with each other. And how should I set up the integrated system.
- Where do i store prompts
- Where do i store json schemas for the agents
- How do I handle multiple agents
- How does each agent communicate with one another.
- How do I make best use of existing infrastrucure.
- How do I handle sessions. 
- How do i properly handle RAG, I have a relational database, as well as chromadb and object storage 
- How do i make best use of the data I will be storing, e.g text, pdfs so that it can be best used in RAG.
- How do i properly set up a tool based system
- The type of tasks I need to be done by agents:
    - Lesson generation
    - Elaborate content
    - Give hints,
    - Generate examples
    - Provide steps
    - Marking short answer
    - Assessment/lesson plans
    - rubric genration
    - automatic reports.
    - etc...

Please review the current set up of the system. I want to improve it to support data rich retrival, and organising the agents in a best practice manner that supports extendability. 
 
#fetch https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/sessions/overview#:~:text=Vertex%20AI%20Agent%20Engine%20Sessions,term%20memory%20and%20conversation%20context
#fetch https://dev.to/marianocodes/adding-sessions-and-memory-to-your-ai-agent-with-agent-development-kit-adk-31ap#:~:text=That%E2%80%99s%20where%20Session%20comes%20in
#fetch https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/sessions/overview#:~:text=,user%20and%20your%20agent%20system 
#fetch https://aws.amazon.com/blogs/database/the-role-of-vector-datastores-in-generative-ai-applications/#:~:text=vector%20capabilities%20along%20with%20the,simplify%20your%20data%20processing%20pipelines
#fetch https://docs.langchain.com/langgraph-platform/application-structure
#fetch https://aicompetence.org/json-prompting-supercharges-multi-agent-ai-systems/#:~:text=Schema%20as%20Contract%20Between%20Agents