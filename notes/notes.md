# Sites Referenced

https://deepstream.io/

https://github.com/deepstreamIO/ds-demo-heroku

https://deepstream-server-1.herokuapp.com/

https://github.com/processing/p5.js/blob/master/contributor_docs/creating_libraries.md

https://elements.heroku.com/addons/autoidle

https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork

# Hello

Sometimes a client "unexpectedly leaves" because ds reconnects them (not sure why).
They get removed from the room and then we don't know they are there, but they are still there because they auto reconnect.
possible fixes

- mark them as missing and reconnect them if they reapear.
- can we have a client readd _themselves_ to room on autoreconnect
- don't remove participants on unexpected leave?
- remove them, but after time delay?


# Updating a local clone of a fork with upstream changes

If you haven't add the upstream branch

```
 git remote add upstream https://github.com/jbakse/deepstream_test.git
```

Make sure you are on the local master branch.

```
git fetch upstream
git merge upstream/master
```