const repl = require("repl");
const Interact = require("./utils/Interact")
const [, , networkName] = process.argv;

const interact = Interact(networkName);

// start repl
const session = repl.start({ prompt: "> " });
session.context.Eth = interact.Eth;
session.context.eth = interact.eth;
session.context.contracts = interact.contracts;
