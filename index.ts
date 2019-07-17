// @ts-ignore
import * as GitHub from 'github-api';
import {object, string} from "prop-types";

const local = { log: (msg: any, msg2?: any) => {} };

class GitApiWrapper {
  user: object;
  // @ts-ignore
  _gh: object;
  // @ts-ignore
  gh: object;

  static newGit(username: string, password: string, token?: string, baseUrl = 'https://api.github.com') {
    let gh;
    if (token) {
      gh = {
        auth: 'oauth',
        token,
      };
    } else {
      gh = {
        username,
        password,
      };
    }
    return new GitHub(gh, baseUrl);
  }
  static defaultProps = {
    username: 'tamer1an',
    reponame: 'react-app-submodule ',
  };
  constructor(config: {username?: string, password?: string, token?: string}) {
    this.user = {};
    const password = config.password || null;
    const username = config.username || null;
    // @ts-ignore
    const gh = this.setGit(GitApiWrapper.newGit(username, password, config.token));
    this._gh = gh;

    // @ts-ignore
    return {
      // @ts-ignore
      instance: this,
      gh,
    };
  }

  getGit() {
    return this._gh;
  }

  async getOrganizations() {
    return await Promise.all([
      this.organizations(0),
      this.organizations(444),
      this.organizations(1111),
    ]);
  }

  // @ts-ignore
  async allStars(username) {
    // @ts-ignore
    const result = await this._gh.getUser(username).listStarredRepos();
    const homaPagesArr = result.data.map((repo: any) => repo.html_url);
    return result;
  }

  // @ts-ignore
  organizations(page = 0, user = this.getUser(), pthen = responseText => {
    const resp = typeof responseText === 'string'
        ? JSON.parse(responseText)
        : responseText;

    local.log(resp);
    return resp;
  }, pcatch = (err: any) => local.log(err)) {
    return fetch(`${user.__apiBase}/organizations?since=${page}`, {
      mode: 'cors',
      method: 'GET',
      headers: {
        Authorization: user.__authorizationHeader,
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, sdch, br',
        'Accept-Language': 'en-GB,en-US;q=0.8,en;q=0.6',
        Connection: 'keep-alive',
        Host: 'github.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36' +
          '(KHTML, like Gecko) Chrome/54.0.2832.2 Safari/537.36',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()).then(pthen).catch(pcatch);
  }

  // @ts-ignore
  setGit(gh = GitApiWrapper.newGit()) {
    this._gh = gh;
    return gh;
  }

  getUser(user: string) {
    const u = user || 'me';
    const git = this.getGit();

    // @ts-ignore
    if (!this.user[u] && u !== 'me') {
      // @ts-ignore
      this.user[u] = git.getUser(u);
    } else if (u === 'me') {
      // @ts-ignore
      this.user[u] = git.getUser();
    }

    // @ts-ignore
    return this.user[u];
  }

  protectionInfo(reposBranchesToProtect: Array<object>, org: string) {
    return reposBranchesToProtect.map((result: Object) => {
      const itemName: string = Object.keys(result)[0];
      // @ts-ignore
      const item = result[itemName];
      return item.branches.map((branch: { name: string}) => {
        const url = item.url.replace('{/branch}', `/${branch.name}`);
        // @ts-ignore
        return this.listBranchProtection({ url })
          .then((protection: object) => ({
            org,
            repo: itemName,
            name: branch.name,
            protection,
            url,
          }));
      });
    });
  }

  /**
   * @param repos
   * @param org
   * @param branchesSet
   * @param defaultBranch
   * @returns {*}
   */
  reposBrIfExist(
    repos: Array<{ name: string}>,
    org = 'tamer1an',
    branchesSet = ['master', 'develop'],
    defaultBranch = true
  ) {
    return repos.map(repo => this.getGit()
      // @ts-ignore
        .getRepo(org, repo.name)
        // @ts-ignore
        .listBranches().then(({ data }) => {
          const toProtect = data.filter((item: { name:string }) => branchesSet.some(v => v === item.name));

          // @ts-ignore
          if (defaultBranch && !toProtect.some(v => v.name === repo.default_branch)) {
            // @ts-ignore
            toProtect.push({ name: repo.default_branch });
          }

          return {
            [repo.name]: {
              // @ts-ignore
              url: repo.branches_url,
              branches: toProtect,
            },
          };
        })
    );
  }

  organisationRepos(org: string) {
    // @ts-ignore
    return this.getGit().getOrganization(org).getRepos();
  }

  repos(
    user = this.getUser(GitApiWrapper.defaultProps.username),
    pthen = (data: { data: object }) => data.data) {
    return user.listRepos().then(pthen);
  }

  email(
    user = this.getUser(GitApiWrapper.defaultProps.username),
    pthen = (data: { data: object }) => local.log('emails', data.data)) {
    return user.getEmails().then(pthen);
  }

  issues(
    user = GitApiWrapper.defaultProps.username,
    repo = GitApiWrapper.defaultProps.reponame,
    pthen = (data: object) => data
  ) {
    // @ts-ignore
    const remoteIssues = this.getGit().getIssues(user, repo);
    return remoteIssues.listIssues({}, pthen);
  }

  notifications(pthen = (data: { data: object }) => data.data) {
    // @ts-ignore
    return this.getUser().listNotifications().then(pthen);
  }

  // @ts-ignore
  listBranchProtection({ url, branch }, user = this.getUser(), pthen = responseText => {
    const resp = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    return resp;
    // @ts-ignore
  }, pcatch = err => local.log(err)) {
    return fetch(`${url}/protection`, {
      mode: 'cors',
      method: 'GET',
      headers: {
        Authorization: user.__authorizationHeader,
        Accept: 'application/json',
        Connection: 'keep-alive',
        Host: 'github.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36' +
          '(KHTML, like Gecko) Chrome/54.0.2832.2 Safari/537.36',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()).then(pthen).catch(pcatch);
  }

  branchProtection(
    // @ts-ignore
    { url },
    protectionOptions = {
      required_pull_request_reviews: {
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false,
      },
      enforce_admins: false,
      restrictions: null,
      required_status_checks: null,
    },
    pthen = (responseText: JSON) => {
      const resp = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
      return resp;
    },
    // @ts-ignore
    user = this.getUser(),
    // @ts-ignore
    pcatch = err => local.log(err),
  ) {
    protectionOptions.restrictions = protectionOptions.restrictions ? protectionOptions.restrictions : null;
    return fetch(`${url}/protection`, {
      mode: 'cors',
      method: 'PUT',
      body: JSON.stringify(protectionOptions),
      headers: {
        Authorization: user.__authorizationHeader,
        Accept: 'application/json',
        Connection: 'keep-alive',
        Host: 'github.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36' +
          '(KHTML, like Gecko) Chrome/54.0.2832.2 Safari/537.36',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()).then(pthen).catch(pcatch);
  }
  // @ts-ignore
  currentUserIssues(user = this.getUser(), pthen = responseText => {
    const resp = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    local.log(resp);
    return resp;
    // @ts-ignore
  }, pcatch = err => local.log(err)) {
    return fetch(`${user.__apiBase}/issues`, {
      mode: 'cors',
      method: 'GET',
      headers: {
        Authorization: user.__authorizationHeader,
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, sdch, br',
        'Accept-Language': 'en-GB,en-US;q=0.8,en;q=0.6',
        Connection: 'keep-alive',
        Host: 'github.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36' +
          '(KHTML, like Gecko) Chrome/54.0.2832.2 Safari/537.36',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()).then(pthen).catch(pcatch);
  }

  static wrap4PromiseAll(
    branchesPromise: Promise<object>,
    resolveCatch = (message: object) => ({
      error: {
        message,
        branches: [],
      },
    }),
    // @ts-ignore
    then = thenData => thenData
  ) {
    // @ts-ignore
    return branchesPromise.map((promise: Promise<object>) =>
      new Promise(
        resolve =>
          promise
            .then((v: object) => resolve(then(v)))
            // @ts-ignore
            .catch(({ message }) => {
              resolve(resolveCatch(message));
            })
      ));
  }
}

export { GitApiWrapper };
