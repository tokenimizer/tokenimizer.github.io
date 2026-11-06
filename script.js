const account = "tokenimizer";
const repositoryList = document.querySelector("#repo-list");
const profileBio = document.querySelector("#profile-bio");
const profileAvatar = document.querySelector("#profile-avatar");

function showRepositoryMessage(message) {
  repositoryList.replaceChildren();
  const notice = document.createElement("p");
  notice.className = "repo-message";
  notice.textContent = message;
  repositoryList.append(notice);
  repositoryList.setAttribute("aria-busy", "false");
}

function createRepositoryCard(repository) {
  const link = document.createElement("a");
  link.className = "repo-card";
  link.href = repository.html_url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", `${repository.name} on GitHub`);

  const title = document.createElement("h3");
  title.textContent = repository.name;
  const description = document.createElement("p");
  description.textContent = repository.description || "An open-source project on GitHub.";
  const arrow = document.createElement("span");
  arrow.className = "repo-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  const metadata = document.createElement("div");
  metadata.className = "repo-meta";

  if (repository.language) {
    const language = document.createElement("span");
    language.className = "repo-language";
    language.textContent = repository.language;
    metadata.append(language);
  }

  const stars = document.createElement("span");
  stars.textContent = `${repository.stargazers_count} stars`;
  metadata.append(stars);
  link.append(title, description, metadata, arrow);
  return link;
}

async function loadProfile() {
  repositoryList.setAttribute("aria-busy", "true");

  try {
    const [profileResponse, repositoriesResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${account}`),
      fetch(`https://api.github.com/users/${account}/repos?sort=updated&per_page=100&type=owner`),
    ]);

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      if (profile.bio && profileBio) profileBio.textContent = profile.bio;
      if (profile.avatar_url) {
        const avatarUrl = new URL(profile.avatar_url);
        avatarUrl.searchParams.set("size", "640");
        profileAvatar.src = avatarUrl.href;
      }
    }

    if (!repositoriesResponse.ok) throw new Error("Repository request failed");
    const repositories = await repositoriesResponse.json();
    const featured = repositories
      .filter((repository) => !repository.fork)
      .sort((first, second) => second.stargazers_count - first.stargazers_count)
      .slice(0, 6);

    if (!featured.length) {
      showRepositoryMessage("No public repositories to show just yet.");
      return;
    }

    repositoryList.replaceChildren(...featured.map(createRepositoryCard));
    repositoryList.setAttribute("aria-busy", "false");
  } catch {
    showRepositoryMessage("Couldn’t load repositories right now. Visit GitHub to see the latest.");
  }
}

loadProfile();