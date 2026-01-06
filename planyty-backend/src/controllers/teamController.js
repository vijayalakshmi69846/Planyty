const { Team, TeamMember, User, Project, sequelize } = require('../models');
const { sendEmailNotification, sendActivityLog } = require('../services/kafka.producer');

// 1. CREATE TEAM (Modified to handle linked projects)
exports.createTeam = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, description, workspace_id, creatorId, members, projectIds } = req.body;
        
        // Create the Team
        const team = await Team.create({
            name,
            description,
            workspace_id,
            creator_id: creatorId 
        }, { transaction: t });

        // Add Creator as Team Lead
        await TeamMember.create({
            team_id: team.id,
            user_id: creatorId,
            role: 'lead'
        }, { transaction: t });

        // ⭐ LINK PROJECTS TO TEAM
        // This assumes the Project model has a 'team_id' foreign key
        if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
            await Project.update(
                { team_id: team.id },
                { 
                    where: { id: projectIds },
                    transaction: t 
                }
            );
        }

        // Handle Members
        if (members && Array.isArray(members)) {
            for (const member of members) {
                if (!member.email) continue; 

                const userToAdd = await User.findOne({ 
                    where: { email: member.email.trim().toLowerCase() } 
                });

                if (userToAdd) {
                    await TeamMember.create({
                        team_id: team.id,
                        user_id: userToAdd.id,
                        role: 'member'
                    }, { transaction: t });

                    // Kafka Email (Non-blocking, so we don't strictly need transaction)
                    await sendEmailNotification('TEAM_INVITATION', member.email, {
                        teamName: team.name,
                        inviter: "Team Lead",
                        taskName: member.taskName,
                        dueDate: member.dueDate
                    });
                }
            }
        }

        await t.commit();

        // Track Activity via Kafka
        await sendActivityLog(creatorId, 'CREATE_TEAM', 'Team', team.id, { name });

        const createdTeam = await Team.findByPk(team.id, {
            include: [
                {
                    model: User,
                    as: 'members',
                    through: { attributes: ['role'] }
                },
                // Include projects in the response so UI updates immediately
                {
                    model: Project,
                    as: 'projects' 
                }
            ]
        });

        res.status(201).json(createdTeam);
    } catch (error) {
        await t.rollback();
        console.error("Create Team Error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.getTeamsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const teams = await Team.findAll({
            attributes: ['id', 'name', 'description', 'workspace_id', 'creator_id'],
            include: [{
                model: User,
                as: 'members',
                attributes: ['id', 'email', 'name'],
                through: { attributes: ['role'] }
            }]
        });

        const userTeams = teams.filter(t => 
            Number(t.creator_id) === Number(userId) || 
            t.members?.some(m => Number(m.id) === Number(userId))
        );

        res.status(200).json(userTeams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ADD INDIVIDUAL MEMBER
exports.addMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { email, role, taskName, dueDate } = req.body;
        const inviterName = req.user?.name || "Team Lead";

        const userToAdd = await User.findOne({ where: { email: email.trim().toLowerCase() } });
        if (!userToAdd) return res.status(404).json({ error: "User not found" });

        const existing = await TeamMember.findOne({ 
            where: { team_id: teamId, user_id: userToAdd.id }
        });
        if (existing) return res.status(400).json({ error: "Already a member" });

        await TeamMember.create({
            team_id: teamId,
            user_id: userToAdd.id,
            role: role || 'member'
        });

        const team = await Team.findByPk(teamId);
        
        // 🚀 Offload Email to Kafka
        await sendEmailNotification('MEMBER_ADDED', email, {
            teamName: team.name,
            inviter: inviterName,
            taskName,
            dueDate
        });

        res.status(200).json({ message: 'Member added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. UPDATE TEAM
exports.updateTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { name, description } = req.body;
        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });
        
        await team.update({ name, description });
        
        // Log update activity
        await sendActivityLog(req.user?.id, 'UPDATE_TEAM', 'Team', teamId);
        
        res.status(200).json({ message: "Updated", team });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 5. DELETE TEAM
exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await Team.findByPk(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });
        
        await team.destroy();
        
        // Log delete activity
        await sendActivityLog(req.user?.id, 'DELETE_TEAM', 'Team', teamId);
        
        res.status(200).json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ error: error.message }); }
};