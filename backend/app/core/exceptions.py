"""
Custom exception classes for AI service errors.
"""


class AIServiceError(Exception):
    """Base exception for AI service failures."""

    def __init__(self, message: str = "AI service encountered an error"):
        self.message = message
        super().__init__(self.message)


class AIResponseParseError(AIServiceError):
    """Raised when the AI response cannot be parsed as valid JSON."""

    def __init__(self, raw_response: str = "", message: str = "Failed to parse AI response as JSON"):
        self.raw_response = raw_response
        self.message = message
        super().__init__(self.message)


class AIRetryExhaustedError(AIServiceError):
    """Raised when all retry attempts for the AI service have been exhausted."""

    def __init__(self, attempts: int = 0, message: str = "AI service retry attempts exhausted"):
        self.attempts = attempts
        self.message = f"{message} after {attempts} attempts"
        super().__init__(self.message)


class AIInvalidCategoryError(AIServiceError):
    """Raised when AI returns a category not in the predefined list."""

    def __init__(self, category: str = "", message: str = "AI returned invalid category"):
        self.category = category
        self.message = f"{message}: '{category}'"
        super().__init__(self.message)
