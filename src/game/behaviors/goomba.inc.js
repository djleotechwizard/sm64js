import { ObjectListProcessorInstance as ObjectListProc } from "../ObjectListProcessor"
import { oGoombaSize, GOOMBA_BP_SIZE_MASK, oBehParams2ndByte, oGoombaScale, oDrawingDistance, oDamageOrCoinValue, oGravity, oForwardVel, oGoombaBlinkTimer, oAnimState, GOOMBA_ACT_ATTACKED_MARIO, oAction, GOOMBA_ACT_WALK, oGoombaRelativeSpeed, oGoombaTurningAwayFromWall, oGoombaTargetYaw, oGoombaWalkTimer, oDistanceToMario, oAngleToMario, oMoveAngleYaw } from "../../include/object_constants"
import * as ObjBhvs2 from "../ObjBehaviors2"
import { INTERACT_BOUNCE_TOP } from "../Interaction"
import { cur_obj_scale, cur_obj_init_animation_with_accel_and_sound, cur_obj_update_floor_and_walls, cur_obj_move_standard, cur_obj_rotate_yaw_toward } from "../ObjectHelpers"

const sGoombaProperties = [
    { scale: 1.5, deathSound: null, drawDistance: 4000, damage: 1 },
    { scale: 3.5, deathSound: null, drawDistance: 4000, damage: 2 },
    { scale: 0.5, deathSound: null, drawDistance: 1500, damage: 0 }
]

const sGoombaHitbox = {
    interactType: INTERACT_BOUNCE_TOP,
    downOffset:         0,
    damageOrCoinValue:  1,
    health:             0,
    numLootCoins:       1,
    radius:             72,
    height:             50,
    hurtboxRadius:      42,
    hurtboxHeight:      40
}

/**
 * Attack handlers for goombas.
 */
const sGoombaAttackHandlers = [
    // regular and tiny
    [
        /* ATTACK_PUNCH:                 */ ObjBhvs2.ATTACK_HANDLER_KNOCKBACK,
        /* ATTACK_KICK_OR_TRIP:          */ ObjBhvs2.ATTACK_HANDLER_KNOCKBACK,
        /* ATTACK_FROM_ABOVE:            */ ObjBhvs2.ATTACK_HANDLER_SQUISHED,
        /* ATTACK_GROUND_POUND_OR_TWIRL: */ ObjBhvs2.ATTACK_HANDLER_SQUISHED,
        /* ATTACK_FAST_ATTACK:           */ ObjBhvs2.ATTACK_HANDLER_KNOCKBACK,
        /* ATTACK_FROM_BELOW:            */ ObjBhvs2.ATTACK_HANDLER_KNOCKBACK,
    ],
    // huge
    [
        /* ATTACK_PUNCH:                 */ ObjBhvs2.ATTACK_HANDLER_SPECIAL_HUGE_GOOMBA_WEAKLY_ATTACKED,
        /* ATTACK_KICK_OR_TRIP:          */ ObjBhvs2.ATTACK_HANDLER_SPECIAL_HUGE_GOOMBA_WEAKLY_ATTACKED,
        /* ATTACK_FROM_ABOVE:            */ ObjBhvs2.ATTACK_HANDLER_SQUISHED,
        /* ATTACK_GROUND_POUND_OR_TWIRL: */ ObjBhvs2.ATTACK_HANDLER_SQUISHED_WITH_BLUE_COIN,
        /* ATTACK_FAST_ATTACK:           */ ObjBhvs2.ATTACK_HANDLER_SPECIAL_HUGE_GOOMBA_WEAKLY_ATTACKED,
        /* ATTACK_FROM_BELOW:            */ ObjBhvs2.ATTACK_HANDLER_SPECIAL_HUGE_GOOMBA_WEAKLY_ATTACKED,
    ]
]

const goomba_act_walk = () => {
    const o = ObjectListProc.gCurrentObject

    ObjBhvs2.treat_far_home_as_mario(1000.0)

    ObjBhvs2.obj_forward_vel_approach(o.rawData[oGoombaRelativeSpeed] * o.rawData[oGoombaScale], 0.4)

    // TODO:  If walking fast enough, play footstep sounds
    if (o.rawData[oGoombaRelativeSpeed] > 4.0 / 3.0) {
    //    cur_obj_play_sound_at_anim_range(2, 17, SOUND_OBJ_GOOMBA_WALK)
    }

    //! By strategically hitting a wall, steep slope, or another goomba, we can
    //  prevent the goomba from turning back toward home for a while (goomba
    //  chase extension)
    //! It seems theoretically possible to get 2-3 goombas to repeatedly touch
    //  each other and move arbitrarily far from their home, but it's
    //  extremely precise and chaotic in practice, so probably can't be performed
    //  for nontrivial distances
    if (o.rawData[oGoombaTurningAwayFromWall]) {
        o.rawData[oGoombaTurningAwayFromWall] = ObjBhvs2.obj_resolve_collisions_and_turn(o.rawData[oGoombaTargetYaw], 0x200)
    } else {
        // If far from home, walk toward home.
        if (o.rawData[oDistanceToMario] >= 25000.0) {
            o.rawData[oGoombaTargetYaw] = o.rawData[oAngleToMario]
            o.rawData[oGoombaWalkTimer] = ObjBhvs2.random_linear_offset(20, 30)
        }

        const targetYawWrapper = { value: o.rawData[oGoombaTargetYaw] }
        o.rawData[oGoombaTurningAwayFromWall] = ObjBhvs2.obj_bounce_off_walls_edges_objects(targetYawWrapper)
        o.rawData[oGoombaTargetYaw] = targetYawWrapper.value

        if (!(o.rawData[oGoombaTurningAwayFromWall])) {
            if (o.rawData[oDistanceToMario] < 500.0) {
                // If close to mario, begin chasing him. If not already chasing
                // him, jump first

                if (o.rawData[oGoombaRelativeSpeed] <= 2.0) {
                    //goomba_begin_jump();
                }

                o.rawData[oGoombaTargetYaw] = o.rawData[oAngleToMario]
                o.rawData[oGoombaRelativeSpeed] = 20.0
            } else {
                // If mario is far away, walk at a normal pace, turning randomly
                // and occasionally jumping

                o.rawData[oGoombaRelativeSpeed] = 4.0 / 3.0
                if (o.rawData[oGoombaWalkTimer] != 0) {
                    o.rawData[oGoombaWalkTimer] -= 1
                } else {
                    if (parseInt((Math.random() * 65500)) & 3) {
                        o.rawData[oGoombaTargetYaw] = ObjBhvs2.obj_random_fixed_turn(0x2000)
                        o.rawData[oGoombaWalkTimer] = ObjBhvs2.random_linear_offset(100, 100)
                    } else {
                        //goomba_begin_jump();
                        o.rawData[oGoombaTargetYaw] = ObjBhvs2.obj_random_fixed_turn(0x6000)
                    }
                }

            }
        }

        cur_obj_rotate_yaw_toward(o.rawData[oGoombaTargetYaw], 0x200)
    }

}

export const bhv_goomba_init = () => {
    const o = ObjectListProc.gCurrentObject

    o.rawData[oGoombaSize] = o.rawData[oBehParams2ndByte] & GOOMBA_BP_SIZE_MASK

    o.rawData[oGoombaScale] = sGoombaProperties[o.rawData[oGoombaSize]].scale

    ObjBhvs2.obj_set_hitbox(o, sGoombaHitbox)

    o.rawData[oDrawingDistance] = sGoombaProperties[o.rawData[oGoombaSize]].drawDistance
    o.rawData[oDamageOrCoinValue] = sGoombaProperties[o.rawData[oGoombaSize]].damage

    o.rawData[oGravity] = -8.0 / 3.0 * o.rawData[oGoombaScale]

}

export const bhv_goomba_update = () => {

    const o = ObjectListProc.gCurrentObject

    if (ObjBhvs2.obj_update_standard_actions(o.rawData[oGoombaScale])) {
        cur_obj_scale(o.rawData[oGoombaScale])

        const blinkWrapper = { value: o.rawData[oGoombaBlinkTimer] }
        ObjBhvs2.obj_update_blinking(blinkWrapper, 30, 50, 5)
        o.rawData[oGoombaBlinkTimer] = blinkWrapper.value

        cur_obj_update_floor_and_walls()

        let animSpeed = o.rawData[oForwardVel] / o.rawData[oGoombaScale] * 0.4
        if (animSpeed < 1.0) { animSpeed = 1.0 }
        cur_obj_init_animation_with_accel_and_sound(0, animSpeed)

        switch (o.rawData[oAction]) {
            case GOOMBA_ACT_WALK:
                goomba_act_walk()
                break
            case GOOMBA_ACT_ATTACKED_MARIO:
                goomba_act_walk()
                break
            default: throw "goomba act not implemented"
        }

        if (ObjBhvs2.obj_handle_attacks(sGoombaHitbox, GOOMBA_ACT_ATTACKED_MARIO,
                                                sGoombaAttackHandlers[o.rawData[oGoombaSize] & 1])) {
            //TODO mark goomba as dead for triplet spawner
        }

        cur_obj_move_standard(-78)

    } else {
        o.rawData[oAnimState] = 1
    }

}