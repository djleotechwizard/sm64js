import { AreaInstance as Area, WARP_TRANSITION_FADE_FROM_STAR, WARP_TRANSITION_FADE_FROM_COLOR, WARP_TRANSITION_FADE_INTO_BOWSER } from "./Area"
import { COURSE_NONE } from "../levels/course_defines"
import * as Mario from "./Mario"
import { CameraInstance as Camera } from "./Camera"
import * as CourseTable from "../include/course_table"
import { gLevelToCourseNumTable } from "./SaveFile"

const PLAY_MODE_NORMAL  =  0
const PLAY_MODE_PAUSED  =  2
const PLAY_MODE_CHANGE_AREA  =  3
const PLAY_MODE_CHANGE_LEVEL  =  4
const PLAY_MODE_FRAME_ADVANCE = 5

const WARP_TYPE_NOT_WARPING = 0
const WARP_TYPE_CHANGE_LEVEL = 1
const WARP_TYPE_CHANGE_AREA = 2
const WARP_TYPE_SAME_AREA = 3
const WARP_NODE_CREDITS_MIN = 0xF8

class HudDisplay {
    constructor(lives, coins, stars, wedges, keys, flags, timer) {
        this.lives = lives;
        this.coins = coins;
        this.stars = stars;
        this.wedges = wedges;
        this.keys = keys;
        this.flags = flags;
        this.timer = timer;
    }
};

class LevelUpdate {
    constructor() {
        // HUDDisplayFlag enum
        this.HUD_DISPLAY_FLAG_LIVES = 0x0001;
        this.HUD_DISPLAY_FLAG_COIN_COUNT = 0x0002;
        this.HUD_DISPLAY_FLAG_STAR_COUNT = 0x0004;
        this.HUD_DISPLAY_FLAG_CAMERA_AND_POWER = 0x0008;
        this.HUD_DISPLAY_FLAG_KEYS = 0x0010;
        this.HUD_DISPLAY_FLAG_UNKNOWN_0020 = 0x0020;
        this.HUD_DISPLAY_FLAG_TIMER = 0x0040;
        this.HUD_DISPLAY_FLAG_EMPHASIZE_POWER = 0x8000;
        this.HUD_DISPLAY_NONE = 0x0000;
        this.HUD_DISPLAY_DEFAULT = this.HUD_DISPLAY_FLAG_LIVES | this.HUD_DISPLAY_FLAG_COIN_COUNT | this.HUD_DISPLAY_FLAG_STAR_COUNT | this.HUD_DISPLAY_FLAG_CAMERA_AND_POWER | this.HUD_DISPLAY_FLAG_KEYS | this.HUD_DISPLAY_FLAG_UNKNOWN_0020;
        this.gHudDisplay = new HudDisplay();
        
        this.WARP_OP_NONE                    = 0x00;
        this.WARP_OP_UNKNOWN_01              = 0x01;
        this.WARP_OP_UNKNOWN_02              = 0x02;
        this.WARP_OP_WARP_DOOR               = 0x03;
        this.WARP_OP_WARP_OBJECT             = 0x04;
        this.WARP_OP_TELEPORT                = 0x05;
        this.WARP_OP_STAR_EXIT               = 0x11;
        this.WARP_OP_DEATH                   = 0x12;
        this.WARP_OP_WARP_FLOOR              = 0x13;
        this.WARP_OP_GAME_OVER               = 0x14;
        this.WARP_OP_CREDITS_END             = 0x15;
        this.WARP_OP_DEMO_NEXT               = 0x16;
        this.WARP_OP_CREDITS_START           = 0x17;
        this.WARP_OP_CREDITS_NEXT            = 0x18;
        this.WARP_OP_DEMO_END                = 0x19;
        this.WARP_OP_TRIGGERS_LEVEL_SELECT   = 0x10;

        this.WARP_NODE_F0               = 0xF0;
        this.WARP_NODE_DEATH            = 0xF1;
        this.WARP_NODE_F2               = 0xF2;
        this.WARP_NODE_WARP_FLOOR       = 0xF3;
        this.WARP_NODE_CREDITS_START    = 0xF8;
        this.WARP_NODE_CREDITS_NEXT     = 0xF9;
        this.WARP_NODE_CREDITS_END      = 0xFA;
        this.WARP_NODE_CREDITS_MIN      = 0xF8;

        this.gMarioState =  {
            unk00: 0, input: 0, flags: 0, particleFlags: 0, action: 0,
            prevAction: 0, terrainsoundAddend: 0, actionState: 0, actionTimer: 0,
            actionArg: 0, intendedMag: 0, intendedYaw: 0, invincTimer: 0,
            framesSinceA: 0, framesSinceB: 0, wallKickTimer: 0, doubleJumpTimer: 0,
            faceAngle: [0, 0, 0],
            angleVel: [0, 0, 0],
            slideYaw: 0, twirlYaw: 0,
            pos: [0, 0, 0],
            vel: [0, 0, 0],
            forwardVel: 0, slideVelX: 0, slideVelY: 0,
            ///// And a ton more
        }

        this.sWarpDest = {
            type: 0, levelNum: 0, areaIdx: 0, nodeId: 0, arg: 0
        }
    }

    lvl_init_from_save_file(arg0, levelNum) {
        Area.gCurrLevelNum = levelNum
        Area.gCurrCourseNum = COURSE_NONE
        Area.gSavedCourseNum = COURSE_NONE
        Area.gCurrCreditsEntry = null

        Mario.init_mario_from_save_file()
        Camera.select_mario_cam_mode()

        return levelNum
    }

    lvl_set_current_level(arg0, levelNum) {
        Area.gCurrLevelNum = levelNum
        Area.gCurrCourseNum = gLevelToCourseNumTable[levelNum - 1]

        // TODO lots of missing code here

        return 1
    }

    lvl_init_or_update(initOrUpdate) {
        return initOrUpdate ? this.update_level() : this.init_level()
    }

    init_mario_after_warp() {
        // struct ObjectWarpNode *spawnNode = area_get_warp_node(sWarpDest.nodeId);
        // u32 marioSpawnType = get_mario_spawn_type(spawnNode->object);
    
        // if (gMarioState->action != ACT_UNINITIALIZED) {
        //     gPlayerSpawnInfos[0].startPos[0] = (s16) spawnNode->object->oPosX;
        //     gPlayerSpawnInfos[0].startPos[1] = (s16) spawnNode->object->oPosY;
        //     gPlayerSpawnInfos[0].startPos[2] = (s16) spawnNode->object->oPosZ;
    
        //     gPlayerSpawnInfos[0].startAngle[0] = 0;
        //     gPlayerSpawnInfos[0].startAngle[1] = spawnNode->object->oMoveAngleYaw;
        //     gPlayerSpawnInfos[0].startAngle[2] = 0;
    
        //     if (marioSpawnType == MARIO_SPAWN_DOOR_WARP) {
        //         init_door_warp(&gPlayerSpawnInfos[0], sWarpDest.arg);
        //     }
    
        //     if (sWarpDest.type == WARP_TYPE_CHANGE_LEVEL || sWarpDest.type == WARP_TYPE_CHANGE_AREA) {
        //         gPlayerSpawnInfos[0].areaIndex = sWarpDest.areaIdx;
        //         load_mario_area();
        //     }
    
        //     init_mario();
        //     set_mario_initial_action(gMarioState, marioSpawnType, sWarpDest.arg);
    
        //     gMarioState->interactObj = spawnNode->object;
        //     gMarioState->usedObj = spawnNode->object;
        // }
    
        // reset_camera(gCurrentArea->camera);
        // sWarpDest.type = WARP_TYPE_NOT_WARPING;
        // sDelayedWarpOp = WARP_OP_NONE;
    
        // switch (marioSpawnType) {
        //     case MARIO_SPAWN_UNKNOWN_03:
        //         play_transition(WARP_TRANSITION_FADE_FROM_STAR, 0x10, 0x00, 0x00, 0x00);
        //         break;
        //     case MARIO_SPAWN_DOOR_WARP:
        //         play_transition(WARP_TRANSITION_FADE_FROM_CIRCLE, 0x10, 0x00, 0x00, 0x00);
        //         break;
        //     case MARIO_SPAWN_TELEPORT:
        //         play_transition(WARP_TRANSITION_FADE_FROM_COLOR, 0x14, 0xFF, 0xFF, 0xFF);
        //         break;
        //     case MARIO_SPAWN_SPIN_AIRBORNE:
        //         play_transition(WARP_TRANSITION_FADE_FROM_COLOR, 0x1A, 0xFF, 0xFF, 0xFF);
        //         break;
        //     case MARIO_SPAWN_SPIN_AIRBORNE_CIRCLE:
        //         play_transition(WARP_TRANSITION_FADE_FROM_CIRCLE, 0x10, 0x00, 0x00, 0x00);
        //         break;
        //     case MARIO_SPAWN_UNKNOWN_27:
        //         play_transition(WARP_TRANSITION_FADE_FROM_COLOR, 0x10, 0x00, 0x00, 0x00);
        //         break;
        //     default:
        //         play_transition(WARP_TRANSITION_FADE_FROM_STAR, 0x10, 0x00, 0x00, 0x00);
        //         break;
        // }
    
        // if (gCurrDemoInput == NULL) {
        //     set_background_music(gCurrentArea->musicParam, gCurrentArea->musicParam2, 0);
    
        //     if (gMarioState->flags & MARIO_METAL_CAP) {
        //         play_cap_music(SEQUENCE_ARGS(4, SEQ_EVENT_METAL_CAP));
        //     }
    
        //     if (gMarioState->flags & (MARIO_VANISH_CAP | MARIO_WING_CAP)) {
        //         play_cap_music(SEQUENCE_ARGS(4, SEQ_EVENT_POWERUP));
        //     }
    
        //     if (sWarpDest.levelNum == LEVEL_CASTLE && sWarpDest.areaIdx == 1
        //         && sWarpDest.nodeId == 31
        //     )
        //         play_sound(SOUND_MENU_MARIO_CASTLE_WARP, gDefaultSoundArgs);
        // }
    }

    initiate_warp(destLevel, destArea, destWarpNode, arg3) {
        if (destWarpNode >= WARP_NODE_CREDITS_MIN) {
            this.sWarpDest.type = WARP_TYPE_CHANGE_LEVEL;
        } else if (destLevel != Area.gCurrLevelNum) {
            this.sWarpDest.type = WARP_TYPE_CHANGE_LEVEL;
        } else if (destArea != Area.gCurrentArea.index) {
            this.sWarpDest.type = WARP_TYPE_CHANGE_AREA;
        } else {
            this.sWarpDest.type = WARP_TYPE_SAME_AREA;
        }
    
        this.sWarpDest.levelNum = destLevel;
        this.sWarpDest.areaIdx = destArea;
        this.sWarpDest.nodeId = destWarpNode;
        this.sWarpDest.arg = arg3;
    }

    warp_level() {
        Area.gCurrLevelNum = this.sWarpDest.levelNum;

        // level_control_timer(TIMER_CONTROL_HIDE);

        Area.load_area(this.sWarpDest.areaIdx);
        this.init_mario_after_warp();
    }


    init_level() {

        let val4 = 0

        this.set_play_mode(PLAY_MODE_NORMAL)
        
        this.sDelayedWarpOp = this.WARP_OP_NONE;
        if (this.gCurrCreditsEntry == undefined) { // Compares to NULL in C code
            this.gHudDisplay.flags = this.HUD_DISPLAY_DEFAULT;
        } else {
            this.gHudDisplay.flags = this.HUD_DISPLAY_NONE;
        }

        if (this.sWarpDest.type != WARP_TYPE_NOT_WARPING) {
            // if (sWarpDest.nodeId >= WARP_NODE_CREDITS_MIN) {
            //     warp_credits();
            // } else {
                this.warp_level();
            // }
        } else {
            if (Area.gMarioSpawnInfo.areaIndex >= 0) {
                Area.load_mario_area()
                Mario.init_marios()
            }

            if (Area.gCurrentArea) {
                Camera.reset_camera(Area.gCurrentArea.camera)
            }

            if (val4 != 0) {
                Area.play_transition(WARP_TRANSITION_FADE_FROM_COLOR, 0x5A, 0xFF, 0xFF, 0xFF)
            } else {
                Area.play_transition(WARP_TRANSITION_FADE_FROM_STAR, 0x10, 0xFF, 0xFF, 0xFF)
            }

        }
        
        return 1
    }

    level_trigger_warp(m, warpOp) {
        var val04 = true;
    
        if (this.sDelayedWarpOp == this.WARP_OP_NONE) {
            // m->invincTimer = -1;
            this.sDelayedWarpArg = 0;
            this.sDelayedWarpOp = warpOp;
    
            switch (warpOp) {
                // case WARP_OP_DEMO_NEXT:
                // case WARP_OP_DEMO_END: sDelayedWarpTimer = 20; // Must be one line to match on -O2
                //     sSourceWarpNodeId = WARP_NODE_F0;
                //     gSavedCourseNum = COURSE_NONE;
                //     val04 = FALSE;
                //     play_transition(WARP_TRANSITION_FADE_INTO_STAR, 0x14, 0x00, 0x00, 0x00);
                //     break;
    
                // case WARP_OP_CREDITS_END:
                //     sDelayedWarpTimer = 60;
                //     sSourceWarpNodeId = WARP_NODE_F0;
                //     val04 = FALSE;
                //     gSavedCourseNum = COURSE_NONE;
                //     play_transition(WARP_TRANSITION_FADE_INTO_COLOR, 0x3C, 0x00, 0x00, 0x00);
                //     break;
    
                // case WARP_OP_STAR_EXIT:
                //     sDelayedWarpTimer = 32;
                //     sSourceWarpNodeId = WARP_NODE_F0;
                //     gSavedCourseNum = COURSE_NONE;
                //     play_transition(WARP_TRANSITION_FADE_INTO_MARIO, 0x20, 0x00, 0x00, 0x00);
                //     break;
    
                case this.WARP_OP_DEATH:
                    // if (m.numLives == 0) {
                    //     sDelayedWarpOp = WARP_OP_GAME_OVER;
                    // }
                    this.sDelayedWarpTimer = 48;
                    this.sSourceWarpNodeId = this.WARP_NODE_DEATH;
                    Area.play_transition(WARP_TRANSITION_FADE_INTO_BOWSER, 0x30, 0x00, 0x00, 0x00);
                    // play_sound(SOUND_MENU_BOWSER_LAUGH, gDefaultSoundArgs);
                    break;
    
    //             case WARP_OP_WARP_FLOOR:
    //                 sSourceWarpNodeId = WARP_NODE_WARP_FLOOR;
    //                 if (area_get_warp_node(sSourceWarpNodeId) == NULL) {
    //                     if (m->numLives == 0) {
    //                         sDelayedWarpOp = WARP_OP_GAME_OVER;
    //                     } else {
    //                         sSourceWarpNodeId = WARP_NODE_DEATH;
    //                     }
    //                 }
    //                 sDelayedWarpTimer = 20;
    //                 play_transition(WARP_TRANSITION_FADE_INTO_CIRCLE, 0x14, 0x00, 0x00, 0x00);
    //                 break;
    
    //             case WARP_OP_UNKNOWN_01: // enter totwc
    //                 sDelayedWarpTimer = 30;
    //                 sSourceWarpNodeId = WARP_NODE_F2;
    //                 play_transition(WARP_TRANSITION_FADE_INTO_COLOR, 0x1E, 0xFF, 0xFF, 0xFF);
    // #ifndef VERSION_JP
    //                 play_sound(SOUND_MENU_STAR_SOUND, gDefaultSoundArgs);
    // #endif
    //                 break;
    
    //             case WARP_OP_UNKNOWN_02: // bbh enter
    //                 sDelayedWarpTimer = 30;
    //                 sSourceWarpNodeId = (m->usedObj->oBehParams & 0x00FF0000) >> 16;
    //                 play_transition(WARP_TRANSITION_FADE_INTO_COLOR, 0x1E, 0xFF, 0xFF, 0xFF);
    //                 break;
    
    //             case WARP_OP_TELEPORT:
    //                 sDelayedWarpTimer = 20;
    //                 sSourceWarpNodeId = (m->usedObj->oBehParams & 0x00FF0000) >> 16;
    //                 val04 = !music_changed_through_warp(sSourceWarpNodeId);
    //                 play_transition(WARP_TRANSITION_FADE_INTO_COLOR, 0x14, 0xFF, 0xFF, 0xFF);
    //                 break;
    
    //             case WARP_OP_WARP_DOOR:
    //                 sDelayedWarpTimer = 20;
    //                 sDelayedWarpArg = m->actionArg;
    //                 sSourceWarpNodeId = (m->usedObj->oBehParams & 0x00FF0000) >> 16;
    //                 val04 = !music_changed_through_warp(sSourceWarpNodeId);
    //                 play_transition(WARP_TRANSITION_FADE_INTO_CIRCLE, 0x14, 0x00, 0x00, 0x00);
    //                 break;
    
    //             case WARP_OP_WARP_OBJECT:
    //                 sDelayedWarpTimer = 20;
    //                 sSourceWarpNodeId = (m->usedObj->oBehParams & 0x00FF0000) >> 16;
    //                 val04 = !music_changed_through_warp(sSourceWarpNodeId);
    //                 play_transition(WARP_TRANSITION_FADE_INTO_STAR, 0x14, 0x00, 0x00, 0x00);
    //                 break;
    
    //             case WARP_OP_CREDITS_START:
    //                 sDelayedWarpTimer = 30;
    //                 play_transition(WARP_TRANSITION_FADE_INTO_COLOR, 0x1E, 0x00, 0x00, 0x00);
    //                 break;
    
    //             case WARP_OP_CREDITS_NEXT:
    //                 if (gCurrCreditsEntry == &sCreditsSequence[0]) {
    //                     sDelayedWarpTimer = 60;
    //                     play_transition(WARP_TRANSITION_FADE_INTO_COLOR, 0x3C, 0x00, 0x00, 0x00);
    //                 } else {
    //                     sDelayedWarpTimer = 20;
    //                     play_transition(WARP_TRANSITION_FADE_INTO_COLOR, 0x14, 0x00, 0x00, 0x00);
    //                 }
    //                 val04 = FALSE;
    //                 break;
            }
    
            // if (val04 && gCurrDemoInput == NULL) {
            //     fadeout_music((3 * sDelayedWarpTimer / 2) * 8 - 2);
            // }
        }
    
        return this.sDelayedWarpTimer;
    }
      
    initiate_delayed_warp() {
        // struct ObjectWarpNode *warpNode;
        // s32 destWarpNode;
    
        if (this.sDelayedWarpOp != this.WARP_OP_NONE && --this.sDelayedWarpTimer == 0) {
        //     reset_dialog_render_state();
    
        //     if (gDebugLevelSelect && (sDelayedWarpOp & WARP_OP_TRIGGERS_LEVEL_SELECT)) {
        //         warp_special(-9);
        //     } else if (gCurrDemoInput != NULL) {
        //         if (sDelayedWarpOp == WARP_OP_DEMO_END) {
        //             warp_special(-8);
        //         } else {
        //             warp_special(-2);
        //         }
        //     } else {
                switch (this.sDelayedWarpOp) {
                    // case WARP_OP_GAME_OVER:
                    //     save_file_reload();
                    //     warp_special(-3);
                    //     break;
    
                    // case WARP_OP_CREDITS_END:
                    //     warp_special(-1);
                    //     sound_banks_enable(2, 0x03F0);
                    //     break;
    
                    // case WARP_OP_DEMO_NEXT:
                    //     warp_special(-2);
                    //     break;
    
                    // case WARP_OP_CREDITS_START:
                    //     gCurrCreditsEntry = &sCreditsSequence[0];
                    //     initiate_warp(gCurrCreditsEntry->levelNum, gCurrCreditsEntry->areaIndex,
                    //                   WARP_NODE_CREDITS_START, 0);
                    //     break;
    
                    // case WARP_OP_CREDITS_NEXT:
                    //     sound_banks_disable(2, 0x03FF);
    
                    //     gCurrCreditsEntry += 1;
                    //     gCurrActNum = gCurrCreditsEntry->unk02 & 0x07;
                    //     if ((gCurrCreditsEntry + 1)->levelNum == LEVEL_NONE) {
                    //         destWarpNode = WARP_NODE_CREDITS_END;
                    //     } else {
                    //         destWarpNode = WARP_NODE_CREDITS_NEXT;
                    //     }
    
                    //     initiate_warp(gCurrCreditsEntry->levelNum, gCurrCreditsEntry->areaIndex,
                    //                   destWarpNode, 0);
                    //     break;
    
                    default:
                        // warpNode = area_get_warp_node(sSourceWarpNodeId);
    
                        // initiate_warp(warpNode->node.destLevel & 0x7F, warpNode->node.destArea,
                                    //   warpNode->node.destNode, sDelayedWarpArg);
                        var LEVEL_CASTLE = 6;
                        this.initiate_warp(LEVEL_CASTLE, 1, 0x1F, 0);
                        
                        // check_if_should_set_warp_checkpoint(&warpNode->node);
                        // if (sWarpDest.type != WARP_TYPE_CHANGE_LEVEL) {
                            // level_set_transition(2, NULL);
                        // }
                        break;
                }
            // }
        }
    }

    play_mode_normal() {
        
        //lots more here
        Area.area_update_objects()
        this.update_hud_values();

        if (Area.gCurrentArea) {
            Camera.update_camera(Area.gCurrentArea.camera)
        }

        this.initiate_delayed_warp();

        if (this.sCurrPlayMode == PLAY_MODE_NORMAL) {
            if (this.sWarpDest.type == WARP_TYPE_CHANGE_LEVEL) {

                this.set_play_mode(PLAY_MODE_CHANGE_LEVEL);
            } 
            // else if (sTransitionTimer != 0) {
            //     set_play_mode(PLAY_MODE_CHANGE_AREA);
            // } else if (pressed_pause()) {
            //     lower_background_noise(1);
            //     gCameraMovementFlags |= CAM_MOVE_PAUSE_SCREEN;
            //     set_play_mode(PLAY_MODE_PAUSED);
            // }
        }

        return 0
    }

    play_mode_change_level() {
        // if (sTransitionUpdate != NULL) {
        //     sTransitionUpdate(&sTransitionTimer);
        // }
    
        // if (--sTransitionTimer == -1) {
        //     gHudDisplay.flags = HUD_DISPLAY_NONE;
        //     sTransitionTimer = 0;
        //     sTransitionUpdate = NULL;
            if (this.sWarpDest.type != WARP_TYPE_NOT_WARPING) {
                return this.sWarpDest.levelNum;
            } else {
                return this.D_80339EE0;
            }
        // }
    
        return 0;
    }

    update_level() {
        let changeLevel

        switch (this.sCurrPlayMode) {
            case PLAY_MODE_NORMAL:
                changeLevel = this.play_mode_normal()
                break
            case PLAY_MODE_CHANGE_LEVEL:
                changeLevel = this.play_mode_change_level()
                break
        }

        return changeLevel
    }

    set_play_mode(playMode) {
        this.sCurrPlayMode = playMode
        this.D_80339ECA = 0
    }

    update_hud_values() {

        if (this.gCurrCreditsEntry == null) {
            const numHealthWedges = this.gMarioState.health > 0 ? this.gMarioState.health >> 8 : 0

            if (Area.gCurrCourseNum > 0) {
                this.gHudDisplay.flags |= this.HUD_DISPLAY_FLAG_COIN_COUNT;
            } else {
                this.gHudDisplay.flags &= ~this.HUD_DISPLAY_FLAG_COIN_COUNT;
            }
    
            if (this.gHudDisplay.coins < this.gMarioState.numCoins) {

                if (window.gGlobalTimer & 0x00000001) {
                    let coinSound
                    if (this.gMarioState.action & (Mario.ACT_FLAG_SWIMMING | Mario.ACT_FLAG_METAL_WATER)) {
                        //coinSound = SOUND_GENERAL_COIN_WATER;
                    } else {
                        //coinSound = SOUND_GENERAL_COIN;
                    }
    
                    this.gHudDisplay.coins += 1;
                    //play_sound(coinSound, this.gMarioState.marioObj.header.gfx.cameraToObject)
                }
            }
    
            if (this.gMarioState.numLives > 100) {
                this.gMarioState.numLives = 100;
            }
    
            var BUGFIX_MAX_LIVES = false;
            if (BUGFIX_MAX_LIVES) {
                if (this.gMarioState.numCoins > 999) {
                    this.gMarioState.numCoins = 999;
                }
        
                if (this.gHudDisplay.coins > 999) {
                    this.gHudDisplay.coins = 999;
                }
            } else {
                if (this.gMarioState.numCoins > 999) {
                    this.gMarioState.numLives = 999; //! Wrong variable
                }
            }
    
            this.gHudDisplay.stars = this.gMarioState.numStars;
            this.gHudDisplay.lives = this.gMarioState.numLives;
            this.gHudDisplay.keys = this.gMarioState.numKeys;

            if (numHealthWedges > this.gHudDisplay.wedges) {
                //play_sound(SOUND_MENU_POWER_METER, gDefaultSoundArgs);
            }
            this.gHudDisplay.wedges = numHealthWedges;
    
            if (this.gMarioState.hurtCounter > 0) {
                this.gHudDisplay.flags |= this.HUD_DISPLAY_FLAG_EMPHASIZE_POWER;
            } else {
                this.gHudDisplay.flags &= ~this.HUD_DISPLAY_FLAG_EMPHASIZE_POWER;
            }
        }
    }
}

export const LevelUpdateInstance = new LevelUpdate()