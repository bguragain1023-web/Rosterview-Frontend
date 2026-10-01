USERS
POST "/login" - for login public
PATCH "/updateuser/:id" - updating user detail - admin only
PATCH "/updateuser/:id/permissions" - for adding additional permissions- only admin
GET "/readuser" - get all the users - all expect worker
POST "/createuser" - creating a user only admin

CLIENT
post "/createclient" - createClient,
get"/" - getClients;
get"/:id" - getSingleClient
patch "/updateclient/:id" - updateClient,

TEAM
POST "/createteam" - for creating a team - admin
GET "/getteams" - Get all teams
GET "/:teamId" - Get single team
PATCH "/assignteamleader" - assign team leader
PATCH "/assignworkerteam" - assign team to a worker

SwapShift
POST "/eligibileshift" - check eligibility worker
POST "/createSwapShift" -create swapshift
PATCH "/:swapShiftId/accept" - accept or reject swapShift by worker
PATCH "/:swapShiftId/review" - review by leaders

SHIFT
post "/createshift" - createShift,
get "/" - fetchAllShifts
get "/:id" - getSingleShift
patch "/:id" - updateShift,
delete "/" - deleteShift,

LEAVE REQUEST
post "/createLeaveRequest" - createLeaveRequest,
get "/" - getLeaveRequests,
patch "/:id/cancel" - cancelLeaveRequest,
patch "/:id/review" - reviewLeaveRequests,

AVAIABILITY
post "/addavailability" - createAvailability,
get "/getallavailability" - getAllAvailability,
patch "/:availabilityId" - updateAvailability,
delete "/:availabilityId" - deleteAvailability,
