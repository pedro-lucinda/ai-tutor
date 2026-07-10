class ApiKeyNotFoundError(Exception):
    def __init__(self, message: str = "Please add your OpenAI API key."):
        super().__init__(message)


class InvalidApiKeyFormatError(Exception):
    pass
