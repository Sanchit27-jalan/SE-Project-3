import openai
import re
import json
from fastapi import HTTPException

class GeneratorService:
    def __init__(self):
        self.api_key = ""
        self.client = openai.OpenAI(api_key=self.api_key)
    
    def _generate_completion(self, prompt, model="gpt-4o", temperature=0.0):
        """Generate a completion using the OpenAI API"""
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def _clean_json_response(self, response):
        """Clean JSON responses that might be wrapped in markdown code blocks"""
        return re.sub(r"^```json\n|```$", "", response.strip())
    
    def generate_tool(self, user_prompt):
        """Generate a tool based on user prompt"""
        prompt = f'''
        You are a tool generator for Agentic systems and are asked to generate a tool for the user strictly in the given example format. Wrap the tool name in double quotes and provide the description, input, and output in the specified format. Provide it in a json parsable format. The keys of the parameter object depend on the type of Tool.
        Example Tool:
            {{
                "name": "Code Analyzer",
                "description": "Extracts information from source code",
                "type": "Information",
                "subtype": "Parser",
                "parameters":{{
                    "language": "Python",
                    "code":"(Source code to be analyzed)",
                    "output_format": "json"
                }}
            }}
        
        User: {user_prompt}
        '''
        
        try:
            response = self._generate_completion(prompt)
            print("Generated Tool:", response)
            clean_response = self._clean_json_response(response)
            return json.loads(clean_response)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def generate_agent(self, user_prompt):
        """Generate an agent based on user prompt"""
        prompt = f'''
        You are a an agent generator and are asked to generate an agent for the user strictly in the given example format. The description should be detailed and must list down an exhaustive list of capabilities. Wrap the Agent name in double quotes and provide the description, capabilities and suggested tools in the specified format. Provide it in a json parsable format. The suggested tools depend on the task of the agent.  
        Example Agent:
            {{
                "name": "Documentation Writer",
                "description": "Creates initial documentation drafts for Software Engineering format and follows proper formatting along with content generation. It also has text summarization capabilities.",
                "type": "AI",
                "subtype": "LLM",
                "capabilities": [
                    "contentGeneration", 
                    "textSummarization", 
                    "formatting"
                ],
                suggested_tools: {{
                    "GrammarChecker": "Checks for grammatical correctness, sentence structure, and clarity in the documentation.",
                    "PlagiarismDetector": "Ensures the generated documentation is original and not copied from external sources.",
                    "MarkdownFormatter": "Formats the documentation into proper Markdown syntax, useful for README files and wikis.",
                    "PDFExporter": "Exports finalized documentation to PDF format for easy sharing and publishing.",
                    "TextSummarizer": "Summarizes long paragraphs or documents into concise descriptions or TL;DR sections.",
                }}
            }},
        
        User: {user_prompt}
        '''
        
        try:
            response = self._generate_completion(prompt)
            print("Generated Agent:", response)
            clean_response = self._clean_json_response(response)
            return json.loads(clean_response)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))