import Vm from "vm.js/build/nodejs/src/vm"
import hooker from "hooker"
import { CodeJar } from 'codejar'
import Prism from 'prismjs';

import * as Keydrown from "../keydrown.min.js"

import { level_main_scripts_entry } from "../levels/scripts"
import { LEVEL_CASTLE_GROUNDS, LEVEL_CASTLE, LEVEL_CASTLE_2, LEVEL_CASTLE_COURTYARD, LEVEL_BOB, LEVEL_CCM, LEVEL_PSS, LEVEL_TTM, LEVEL_WF, LEVEL_HMC, LEVEL_BBH, LEVEL_SSL, LEVEL_SL } from "../levels/level_defines_constants"

import { CameraInstance as Camera } from "../game/Camera"
import { LevelUpdateInstance as LevelUpdate } from "../game/LevelUpdate"
import { GameInstance as Game } from "../game/Game"
import { LevelCommandsInstance as LevelCommands } from "../engine/LevelCommands"
import { PrintInstance as Print } from "../game/Print"

const highlight = function (editor) {
    var code = editor.textContent;
    code = Prism.highlight(code, Prism.languages.javascript, 'javascript');
    editor.innerHTML = code;
};

let jar = CodeJar(document.querySelector('#scriptTextArea'), highlight);

const levelTable = {
        "Castle Grounds":               LEVEL_CASTLE_GROUNDS,
        "Castle Courtyard":             LEVEL_CASTLE_COURTYARD,
        "Bob-omb Battlefield":          LEVEL_BOB,
        "Cool, Cool Mountain":          LEVEL_CCM,
        "Princess's Secret Slide":      LEVEL_PSS,
        "Tall, Tall Mountain":          LEVEL_TTM,
        "Whomps Fortress":              LEVEL_WF,
        "Hazy Maze Cave":               LEVEL_HMC,
        "Big Boo's Haunt":              LEVEL_BBH,
        "Shifting Sand Land":           LEVEL_SSL,
        "Snowman's Land":               LEVEL_SL,
        "Castle Inside First Level":    LEVEL_CASTLE,
        "Castle Inside Second Level":   LEVEL_CASTLE_2
}

const getSelectedLevel = () => {
    const mapSelect = document.getElementById("mapSelect").value

    return levelTable[mapSelect];
}

export class SM64vm {
    constructor() {
        this.running = false;

        this.setupVM();
        this.setupInterface();
    }

    setupVM() {
        this.vm = new Vm();
        this.addHelpers();
        this.addCamera();
        this.addInput();
        this.addMario();
    }

    addHelpers() {
        var ref = this;

        this.vm.realm.global.console = { log: this.consoleLog };
        this.vm.realm.global.stringify = function (obj) { return JSON.stringify(obj); };
        this.vm.realm.global.cancel = hooker.preempt;
        this.vm.realm.global.Math = Math;
        this.vm.realm.global.Date = Date;

        this.vm.realm.global.onNewFrame = function () { };

        this.vm.realm.global.hud = {
            print: function (text, x = 0, y = 0) {
                Print.print_text(x, y, text);
            }
        }
        this.vm.realm.global.setInterval = function (f, time) {
            var errorCatcher = function () { // VM requires recursive error checking for some reason
                try {
                    f();
                } catch (error) {
                    ref.consoleLog(error.message);
                }
            };
            setInterval(errorCatcher, time);
        };

        this.vm.realm.global.skipIntro = false;
        this.vm.realm.global.startArea = "Bob-omb Battlefield";

        var skipIntroScript = function(level)  {
            return [
                { command: LevelCommands.load_area, args: [1] },
                { command: LevelCommands.transition, args: [8, 20, 0, 0, 0] },
                { command: LevelCommands.unload_area, args: [1] },
                { command: LevelCommands.set_register, args: [levelTable[level]] },
                { command: LevelCommands.execute, args: [level_main_scripts_entry] }
            ];
        } 

        var skipped = false;
        hooker.hook(Game, "main_loop_one_iteration", function () {
            if (!skipped && ref.vm.realm.global.skipIntro) {
                var script = skipIntroScript(ref.vm.realm.global.startArea);
                LevelCommands.start_new_script(script);
                skipped = true;
            }
            ref.vm.realm.global.onNewFrame();
        });

        this.vm.realm.global.warp = function(index) {
            LevelUpdate.level_trigger_warp(LevelUpdate.gMarioState, LevelUpdate.WARP_OP_DEATH);
        };
    }

    consoleLog(...text) {
        console.log(text.join(" "));
    }

    addInput() {
        this.vm.realm.global.keys = Keydrown;
    }

    addMario() {
        var ref = this;
        var mario = {
            getPosition: function () {
                var pos = LevelUpdate.gMarioState.pos;
                return { x: pos[0], y: pos[1], z: pos[2] };
            },
            // addCoins: function (amount) {
            //     var rawData = {}
            //     rawData[oDamageOrCoinValue] = amount;
            //     Interact.interact_coin(LevelUpdate.gMarioState, { rawData: rawData })
            //     if (amount < 0)
            //         LevelUpdate.gHudDisplay.coins = LevelUpdate.gMarioState.numCoins;
            // },
            // setCoins: function (amount) {
            //     LevelUpdate.gMarioState.numCoins = amount;
            //     LevelUpdate.gHudDisplay.coins = LevelUpdate.gMarioState.numCoins;
            // }
            // setPosition: function (x, y, z) {
            //     LevelUpdate.gMarioState.pos = [0, 0, 0];
            //     MarioStep.perform_air_step(LevelUpdate.gMarioState, 0);
            // },
            // getAction: function () { return LevelUpdate.gMarioState.action; },
            // onActionChange: function () { }
        };

        // hooker.hook(Mario, "set_mario_action", function () {
        //     var marioRef = ref.vm.realm.global.mario;
        //     var currentAction = marioRef.getAction();
        //     var newAction = arguments[1];
        //     var constants = MarioConstants.default;
        //     return ref.vm.realm.global.mario.onActionChange(constants[currentAction], constants[newAction]);
        // });

        this.vm.realm.global.mario = mario;
    }

    addCamera() {
        var ref = this;

        hooker.hook(Camera, "update_camera", function () {
            if (!ref.vm.realm.global.camera.active)
                return hooker.preempt(); // stops function from being executed
        });

        var camera = {
            active: true
        };

        this.vm.realm.global.camera = camera;
    }


    setupInterface() {
        var ref = this;

        // fetch(new Request('http://localhost:1323/init'))
        //     .then(response => response.json())
        //     .then(data => {
        //         jar.updateCode(data.Text);
        //         ref.saveScript(true);
        //     })
        //     .catch(console.error);

        // setInterval(async function () {
        //     fetch(new Request('http://localhost:1323/script'))
        //         .then(response => response.json())
        //         .then(data => {
        //             if (data.Text != "") {
        //                 jar.updateCode(data.Text);
        //                 ref.saveScript();
        //             }
        //         })
        //         .catch(console.error);
        // }, 10);



        $("#runScriptButton").prop("disabled", false);
        $("#scriptTextArea").prop("disabled", false);

        if (localStorage["script"] != "")
            jar.updateCode(localStorage["script"]);

        $("#saveScriptButton").click(function () {
            ref.saveScript();
        });
    }

    saveScript(init = false) {
        var script = jar.toString();
        localStorage["script"] = script;
        if (this.running) {
            document.getElementById("scriptStatus").innerHTML = "New script saved, old script is still running...</br>Reload to run new script";
            window.location = window.location;
        } else if (!init) {
            document.getElementById("scriptStatus").innerHTML = "Script saved! No script running";
        }
    }

    runInterface() {
        this.running = true;

        var script = jar.toString();

        function makeUnselectable(node) {
            if (node.nodeType == 1) {
                node.setAttribute("unselectable", "on");
            }
            var child = node.firstChild;
            while (child) {
                makeUnselectable(child);
                child = child.nextSibling;
            }
        }

        // makeUnselectable(document.getElementById("scriptTextArea"));
        // $("#scriptTextArea").addClass("unselectable")
        document.getElementById("scriptStatus").innerHTML = "Script running...";

        localStorage["script"] = script;
        this.runScript(script);
    }

    runScript(text) {
        try {
            var script = Vm.compile(text, "script.js");
            this.vm.run(script);
        } catch (error) {
            this.consoleLog(error.message);
        }
    }
}