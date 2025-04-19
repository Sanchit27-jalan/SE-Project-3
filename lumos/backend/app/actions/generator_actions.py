from app.services.generator_service import GeneratorService

GENERATE_TOOL_REQUEST = 'GENERATE_TOOL_REQUEST'
GENERATE_TOOL_SUCCESS = 'GENERATE_TOOL_SUCCESS'
GENERATE_TOOL_FAILURE = 'GENERATE_TOOL_FAILURE'
GENERATE_AGENT_REQUEST = 'GENERATE_AGENT_REQUEST'
GENERATE_AGENT_SUCCESS = 'GENERATE_AGENT_SUCCESS'
GENERATE_AGENT_FAILURE = 'GENERATE_AGENT_FAILURE'

service = GeneratorService()

def generate_tool_action(user_prompt):
    async def thunk(dispatch, get_state):
        dispatch({'type': GENERATE_TOOL_REQUEST})
        try:
            result = service.generate_tool(user_prompt)
            dispatch({'type': GENERATE_TOOL_SUCCESS, 'payload': result})
            return result
        except Exception as e:
            dispatch({'type': GENERATE_TOOL_FAILURE, 'error': str(e)})
            raise
    return thunk


def generate_agent_action(user_prompt):
    async def thunk(dispatch, get_state):
        dispatch({'type': GENERATE_AGENT_REQUEST})
        try:
            result = service.generate_agent(user_prompt)
            dispatch({'type': GENERATE_AGENT_SUCCESS, 'payload': result})
            return result
        except Exception as e:
            dispatch({'type': GENERATE_AGENT_FAILURE, 'error': str(e)})
            raise
    return thunk
