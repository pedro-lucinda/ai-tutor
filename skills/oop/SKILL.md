# Object-Oriented Programming

## Explanations
Classes, instances, methods, `__init__`.

## Examples
```python
class Counter:
    def __init__(self):
        self.value = 0
    def inc(self):
        self.value += 1
```

## Exercises
Implement a `BankAccount` with `deposit` and `balance`.

## Quizzes
What is `self` in a method?

## Grading rubric
- Encapsulation: 40%
- Correct behavior: 60%

## Common mistakes
Forgetting `self` in method definitions.

## Best practices
Keep classes focused on one concept.
