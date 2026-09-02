name: Bug Report
description: Report a bug or styling inaccuracy in DressRight AI
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: Thanks for helping improve DressRight AI!
  - type: textarea
    id: bug-description
    attributes:
      label: Bug Description
      description: Detailed summary of what went wrong.
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
    validations:
      required: true
