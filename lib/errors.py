"""Parser errors with an HTTP status code, matching the old Node API."""


class ParserError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def create_parser_error(message, status=400):
    return ParserError(message, status)
