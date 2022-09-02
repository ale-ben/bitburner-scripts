/**

functions

* create a schedule for a target

inputs

* targets
* current time
* previous schedules

variables

* time that a schedule is started
* time that a new schedule should be made and ran
* time that a schedule finishes

process

* a new schedule needs to be created and ran when the duration of paddings of the previous schedule has elapsed.
* to ensure that there is no downtime and overlap between the last task of the current schedule and the first task of the next scheudle, the minimum length a schedule should be long enough is such that the amount of paddings in the schedule is greater than or equal to the duration of the longest action (weaken).
	* e.g., if longest task takes 10 seconds before it starts, the amount of paddings have to be at least 10 seconds before starting the tasks in the next schedule.
* prioritise adding another schedule to the better targets rather than adding a new schedule for worse targets.

*/


