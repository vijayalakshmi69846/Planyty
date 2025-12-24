const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

const isAdmin = authorize('admin');
const isTeamLead = authorize('admin', 'team_lead');
const isMember = authorize('admin', 'team_lead', 'member');

module.exports = { authorize, isAdmin, isTeamLead, isMember };