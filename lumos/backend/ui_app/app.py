from flask import Flask, request, render_template
import os
import json
import openai
import re

app = Flask(__name__)

config = json.loads(os.environ.get("CONFIG", "{}"))
OPENAI_API_KEY = ""

@app.route('/', methods=['GET', 'POST'])
def home():
    output = ""
    
    if request.method == 'POST':
        user_input = request.form.get("user_input")
        # Do any processing
        
        prompt = f'''
        Given a user instruction and a multi-agent system, Simulate the user instruction using the multi-agent system and provide the complete react format in a json where the planning and actions of each agent, interaction between agents and interactions with tools are completely described by the React format. You can only use the agents, tools and the interactions between tools described in the multi-agent system description. Follow the ids present in interactions to simulate the interactions.
        
        {{  
  "name": "Component Description - Fact Checker",  
  "type": "workflow",  
  "version": "1.0",  
  "description": "Generate and verify a short description of the Fact Checker agent.",  
  "steps": [  
    {{  
      "id": "thought-init",  
      "type": "thought",  
      "agent": "doc-writer",  
      "content": "I'll write a short component description for the Fact Checker."  
    }},  
    {{  
      "id": "write-description",  
      "type": "action",  
      "agent": "doc-writer",  
      "tool": "DocDraftCreator",  
      "input": "input_type: summary\naudience: developer\noutput_format: markdown",  
      "output": "### Fact Checker\nThe Fact Checker agent is responsible for validating technical claims within the documentation. It combines rule-based logic with LLM reasoning to ensure factual accuracy and consistency."  
    }},  
    {{  
      "id": "send-for-verification",  
      "type": "message",  
      "from": "doc-writer",  
      "to": "fact-checker",  
      "messageType": "Command",  
      "content": "task: Verify component description\ntext: The Fact Checker agent is responsible for validating technical claims..."  
    }},  
    {{  
      "id": "verify-short-description",  
      "type": "action",  
      "agent": "fact-checker",  
      "tool": "ClaimVerifier",  
      "input": "input_type: sentence\nconfidence_threshold: 0.8\noutput_format: inline_annotated",  
      "output": "The Fact Checker agent is responsible for validating technical claims [✔️ verified]..."  
    }},  
    {{  
      "id": "respond-to-writer",  
      "type": "message",  
      "from": "fact-checker",  
      "to": "doc-writer",  
      "messageType": "Response",  
      "content": "status: Verified\nannotated_text: The Fact Checker agent is responsible for validating technical claims [✔️ verified]..."  
    }}  
  ]  
}}

        Ensure that the exact react format is used and output a json parsable format.
        
        User Instruction: {user_input}
        
        Multi-Agent System: {config}
        
        React:'''
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        message = response.choices[0].message.content.strip()
        print("Generated Tool:", message)
        message = re.sub(r"^```json\n|```$", "", message.strip())
        output = message
        raw_output = ""
        try:
            output = json.loads(message)
        except json.JSONDecodeError:
            print("Failed to parse JSON. Showing raw response.")
            raw_output = message
        # final = user_input.split(",")[0]
        # output = f"Processed: {final}"
    return render_template('index.html', output=output)
    # return {"message":"hi"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
