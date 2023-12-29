import db from "../database/db.js"

const scoutAttendanceController = {
    // @desc    Insert a new attendance record for a scout in a certain sector
    // @route   POST /api/sectorAttendance/
    // @access  Private
    upsertAttendance: async (req, res) => {
        try {
            // NOTE: attendanceRecords must be sent as an array of objects in the request body
            const { attendanceRecords }  = req.body

            if (attendanceRecords === 0) {
                return res.status(404).json({
                    error: "No records were found"
                })
            }

            const weekNumber = attendanceRecords[0].weekNumber;
            const termNumber = attendanceRecords[0].termNumber;
            
            // Query to check if there are an exisiting records for this week & term or not
            const prevRecords = await db.query(`
                SELECT *
                FROM "ScoutAttendance"
                WHERE "weekNumber" = $1 AND "termNumber" = $2;
            `,
            [weekNumber, termNumber])

            let result = [];
            
            // If the attendance records already exists then update them, if not insert a new records
            if (prevRecords.rowCount === 0)
            {
                for (let i = 0; i < attendanceRecords.length; i++) {   

                    // Insert a new record from the attendance array into the databse
                    const queryResult = await db.query(`
                        INSERT INTO "ScoutAttendance" VALUES ($1, $2, $3, $4)
                        RETURNING *;
                    `,
                    [attendanceRecords[i].scoutId, attendanceRecords[i].weekNumber, attendanceRecords[i].termNumber, attendanceRecords[i].attendanceStatus]
                    )

                    // Add the newly inserted record to the result array to return back
                    result.push(queryResult.rows[0]);
                }
            }
            else {
                for (let i = 0; i < attendanceRecords.length; i++) {
                    
                    // Update the current record from the array
                    const queryResult = await db.query(`
                        UPDATE "ScoutAttendance" SET "attendanceStatus" = $4
                        WHERE "scoutId" = $1 AND "weekNumber" = $2 AND "termNumber" = $3
                        RETURNING *;
                    `,
                    [attendanceRecords[i].scoutId, attendanceRecords[i].weekNumber, attendanceRecords[i].termNumber, attendanceRecords[i].attendanceStatus]
                    )

                    // Add the info about the updated record into the result array
                    result.push(queryResult.rows[0]);
                }
            }

            // Return a success message
            res.status(200).json({
                message: "Successful insertion",
                body: result,
                count: result.length,
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: 'An error occured while inserting a new attendance',
                body: error,
            })
        }
    },

    // @desc    Get all attendance records for all the scouts in a certain sector in a certain week & term
    // @route   GET /api/sectorAttendance/sector/all
    // @access  Private
    getSectorAttendance: async (req, res) => {
        try {
            const { baseName, suffixName, weekNumber, termNumber } = req.query

            const result = await db.query(`
                SELECT "Scout".*, "ScoutAttendance".* FROM "Scout" LEFT JOIN "ScoutAttendance" ON "Scout"."scoutId" = "ScoutAttendance"."scoutId"
                AND "ScoutAttendance"."weekNumber" = $3 AND "ScoutAttendance"."termNumber" = $4
                INNER JOIN "Sector" ON "Sector"."baseName" = "Scout"."sectorBaseName" AND "Sector"."suffixName" = "Scout"."sectorSuffixName"
                WHERE "Sector"."baseName" = $1 AND "Sector"."suffixName" = $2;
            `,
            [baseName, suffixName, weekNumber, termNumber])

            if (result.rowCount === 0) {
                return res.status(404).json({
                    error: "No data exists for the provided info"
                })
            }

            res.status(200).json({
                message: "Successful retrieval",
                body: result.rows,
                count: result.rowCount
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: 'An error occured while retrieving sector attendance',
                body: error,
            })
        }
    },

    // @desc    Get attendance records for a certain scout in a certain week & term
    // @route   GET /api/sectorAttendance/:scoutId/:weekNumber/:termNumber
    // @access  Private
    getScoutAttendance: async (req, res) => {
        try {
            const { scoutId, weekNumber, termNumber } = req.params

            const result = await db.query(`
                SELECT *
                FROM "ScoutAttendance"
                WHERE "scoutId" = $1 AND "weekNumber" = $2 AND "termNumber" = $3
            `,
            [scoutId, weekNumber, termNumber])

            res.status(200).json({
                message: "Successful retrieval",
                body: result.rows,
                count: result.rowCount,
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({
                error: 'An error occured while retrieving sector attendance',
                body: error,
            })
        }
    }
}

export default scoutAttendanceController;