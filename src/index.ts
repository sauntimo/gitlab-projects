#!/usr/bin/env node
import dotenv from 'dotenv';
import chalk from 'chalk';
import fetch from 'node-fetch';
import path from 'path';
import shell from 'shelljs';

type GLProject = {
  id: number;
  name: string;
  path_with_namespace: string;
  ssh_url_to_repo: string;
  default_branch: string;
  namespace: {
    full_path: string;
  }
}

// get env vars from .env file into process.env
dotenv.config({path: path.join(__dirname + '/../.env')});
const numProjects = Math.min(parseInt(process.env.GITLAB_NUM_PROJECTS ?? "100", 10),100);

/**
 * Get a list of gitlab projects which the user has access to
 */
const getProjects = async (page = 1): Promise<GLProject[]> => {

  const endpoint = '/v4/projects';
  const queryData: Record<string, string> = {
    archived: 'no',
    last_activity_after: '2020-01-01T00:00:00Z',
    order_by: 'name',
    sort: 'asc',
    per_page: `${numProjects}`,
    page: page.toString(),
  };
  
  const query = '?' + new URLSearchParams(queryData).toString();
  const response = await fetch(process.env.GITLAB_BASE_URL + endpoint + query, {
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': process.env.GITLAB_API_KEY as string, 
    },
  });

  if(!response.ok){
    logMessage('red',`Failed to get projects from Gitlab`);
    process.exit(1);
  }

  let data = await response.json();

  const safeHeader = (name: string) => parseInt(response.headers.get(name) ?? "0", 10);
  const totalResults = safeHeader('x-total');
  const currentPage = safeHeader('x-page');
  const totalPages = safeHeader('x-total-pages');
  const nextPage = safeHeader('x-next-page');

  const fetchedResults = (page * numProjects) < totalResults
    ? (page * numProjects)
    : totalResults;

  logMessage('white', `Fetched ${fetchedResults}/${totalResults} projects...`);

  // if there are more pages of data, fetch them recursively.
  if(currentPage < totalPages){
    const nextPageData = await getProjects(nextPage);
    data = data.concat(nextPageData);
  }

  return data;
}


/**
 * Process gitlab projects
 */
const processResult = (data: GLProject[]): void => {
  const projects: {[key: string]: any} = {};

  const names = data.map((project: GLProject) => {
    const newDir = process.env.GITLAB_BASE_DIR + project.path_with_namespace;
    logMessage(`blue`,`Processing ${project.name}...`);

    if (!shell.test('-e', newDir)){
      logMessage(`orange`,`New project - creating folder and cloning.`);
      shell.mkdir('-p', newDir);
      if (shell.exec(`git clone ${project.ssh_url_to_repo} ${newDir} -q`).code !== 0) {
        shell.echo(`Error: Git clone failed for project ${project.name}`);
        shell.exit(1);
      }
    } else {
      logMessage(`green`,`Project already cloned; switching to default branch and pulling.`);
      if (shell.exec(`(cd ${newDir} && git checkout ${project.default_branch} -q && git pull -q)`).code !== 0) {
        shell.echo(`Error: Git pull failed for project ${project.name}`);
        shell.exit(1);
      }
    }
  });
}

/**
 * Display feedback
 * @param colour colour of message text
 * @param text message to print
 */
const logMessage = (colour: string, text: string): void => {
  console.log(
    chalk.bgCyan.white.bold('gitlab_projects'),
    chalk.keyword(colour)(text)
  );
}

/**
 * Wrapper function for async error handling
 */
const main = async () => {

  if (!shell.which('git')) {
    logMessage(`red`,`Sorry, this script requires git`);
    process.exit(1);
  }

  const missingVariables = ['GITLAB_BASE_URL', 'GITLAB_API_KEY', 'GITLAB_BASE_DIR']
    .filter((key: string) => typeof process.env[key] === 'undefined');

  if(missingVariables.length){
    logMessage(`red`,`Please ensure .env contains ${missingVariables.join(', ')}`);
    process.exit(1);
  }

  try {
    const data = await getProjects();
    processResult(data);
  } catch (err) {
    console.log(
      chalk.bgCyan.white.bold('gitlab_projects'),
      chalk.red(err)
    );
    process.exit(1);
  }  
}

main();
