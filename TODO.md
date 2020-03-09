
# Bugs:

- Get OUTPUT div working in modals
- Re-enable modal for Pods (broken since adding container blocks)
- fix occasional pausing
- fix difficulty to select dropdown (keeps refreshing)
- fix layout bugs (pods alongside arbitrary(first) replicaSet, not necessarily correct version)

# Scenario features:

- Use colour for plain text output to show service upgrades
- Look at https://github.com/hjacobs/kube-ops-view (TUI) for ideas
- Show #Pods on a node in node title.

# Boxes (Nodes, Services, Deploys, RS, Pods):
Title line + smaller lines

# Shapes
Shapes to distinguish elements.

# Colors
Better color scheme, use blue.

# Videos
For DockerCon
For Confoo.ca
For DevConf.cz
For UK Meetups
For Lyon/GVA Meetups

- Share with Herman

# API Explorer
Add some sort of API browser (based on swagger.json)
Look here: https://github.com/swagger-api
           https://swagger.io/tools/swagger-ui/
           https://github.com/swagger-api/swagger-ui/issues/834
           https://chrome.google.com/webstore/detail/swagger-ui-console/ljlmonadebogfjabhkppkoohjkjclfai?hl=en


# jsPlumb
Try this to connect Pods->ReplicaSet(or other cllr)->Deploy->Service


