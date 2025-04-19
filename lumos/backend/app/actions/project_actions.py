import app.controllers.export_controller as export_controller

EXPORT_PROJECT_REQUEST = 'EXPORT_PROJECT_REQUEST'
EXPORT_PROJECT_SUCCESS = 'EXPORT_PROJECT_SUCCESS'
EXPORT_PROJECT_FAILURE = 'EXPORT_PROJECT_FAILURE'
SAVE_PROJECT_REQUEST = 'SAVE_PROJECT_REQUEST'
SAVE_PROJECT_SUCCESS = 'SAVE_PROJECT_SUCCESS'
SAVE_PROJECT_FAILURE = 'SAVE_PROJECT_FAILURE'

def export_project_action(project_data):
    async def thunk(dispatch, get_state):
        dispatch({'type': EXPORT_PROJECT_REQUEST})
        result = await export_controller.service.export_project(project_data)
        if result['status'].startswith('error'):
            dispatch({'type': EXPORT_PROJECT_FAILURE, 'error': result})
        else:
            dispatch({'type': EXPORT_PROJECT_SUCCESS, 'payload': result})
        return result
    return thunk


def save_project_action(project_data):
    def thunk(dispatch, get_state):
        dispatch({'type': SAVE_PROJECT_REQUEST})
        result = export_controller.service.save_project(project_data.dict())
        if result['status'] == 'error':
            dispatch({'type': SAVE_PROJECT_FAILURE, 'error': result})
        else:
            dispatch({'type': SAVE_PROJECT_SUCCESS, 'payload': result})
        return result
    return thunk
