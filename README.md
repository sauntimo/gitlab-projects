# Gitlab Projects

Small command line app, written in typescript, to clone all gitlab projects which a user has access to.

If a project already exists locally, switches to the default branch and pulls.

### Installation

- clone the repo
  ```
  $ git clone git@github.com:sauntimo/gitlab-projects.git gitlab-projects
  ```
  
- initialise
  ```
  $ cd gitlab-projects && npm i -g 
  ```

- get an [Personal Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) from Gitlab.

- copy the `.env.sample` file to `.env` and add the required variables
  ```
  $ cp .env.sample .env
  ```

### Usage

```
$ gitlab_projects
```

![image](https://user-images.githubusercontent.com/2720466/96970531-c17dc200-150b-11eb-8dd2-2468f8c6f506.png)
