import threading

class Store:
    def __init__(self, reducer, initial_state=None):
        self._lock = threading.Lock()
        self.reducer = reducer
        self.state = initial_state or {}
        self.listeners = []

    def get_state(self):
        return self.state

    def dispatch(self, action):
        # support thunk-like actions
        if callable(action):
            return action(self.dispatch, self.get_state)
        # reduce state
        with self._lock:
            self.state = self.reducer(self.state, action)
        for listener in self.listeners:
            listener()
        return action

    def subscribe(self, listener):
        self.listeners.append(listener)


def project_reducer(state, action):
    if action.get('type') == 'EXPORT_PROJECT_SUCCESS':
        return {**state, 'exportResult': action.get('payload')}
    if action.get('type') == 'EXPORT_PROJECT_FAILURE':
        return {**state, 'exportError': action.get('error')}
    if action.get('type') == 'SAVE_PROJECT_SUCCESS':
        return {**state, 'saveResult': action.get('payload')}
    if action.get('type') == 'SAVE_PROJECT_FAILURE':
        return {**state, 'saveError': action.get('error')}
    return state


def generator_reducer(state, action):
    if action.get('type') == 'GENERATE_TOOL_SUCCESS':
        return {**state, 'tool': action.get('payload')}
    if action.get('type') == 'GENERATE_TOOL_FAILURE':
        return {**state, 'toolError': action.get('error')}
    if action.get('type') == 'GENERATE_AGENT_SUCCESS':
        return {**state, 'agent': action.get('payload')}
    if action.get('type') == 'GENERATE_AGENT_FAILURE':
        return {**state, 'agentError': action.get('error')}
    return state


def root_reducer(state, action):
    return {
        'project': project_reducer(state.get('project', {}), action),
        'generator': generator_reducer(state.get('generator', {}), action)
    }

# initialize store with combined reducer
store = Store(root_reducer, initial_state={})
