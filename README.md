# jetti-commitgpt

Automatically generate commit messages using ChatGPT.

![commitgpt](https://user-images.githubusercontent.com/3975738/205517867-1e7533ae-a8e7-4c0d-afb6-d259635f3f9d.gif)

### Important note
A commit will be executed only based on changes made in the following `fileExtensions`: [
    '*.js',
    '*.css',
    '*.ts',
    '*.md',
    '*.pug',
    '*.html',
    '*.txt',
    '*.yaml',
    '*.json',
]

To commit additional/different types of files:
```
npm run start ".gitignore" "Dockerfile" ".scss"
```

## How to use?

```bash
npm run start
```

### Get an OpenAI API key
https://platform.openai.com/account/api-keys

### Configuration (Optional)
you can create `.commitgpt.json` and/or `..commitgpt-template` config files in your project root. 

#### `.commitgpt.json` file
default: 
```json
{
  "model": "text-davinci-003",
  "temperature": 0.5,
  "maxTokens": 2048,
}
```
this file can be used to change the OpenAI model and other parameters.


### `.commitgpt-template` file
default:
```
suggest 10 commit messages based on the following diff:
{{diff}}
commit messages should:
 - follow conventional commits
 - message format must be: <type>[{{currentBranch}}]: <description>

examples:
 - fix:[{{currentBranch}}] - add password regex pattern
 - test:[{{currentBranch}}] - add new test cases
 - refactor:[{{currentBranch}}] - update logic around order handling
 - feat:[{{currentBranch}}] - add a new option to sync prices
```

this file can be used to change the template used to generate the prompt request. you can modify the template to fit your needs.

## How it works

- Runs `git diff --cached`
- Sends the diff to ChatGPT and asks it to suggest commit messages
- Shows suggestions to the user
