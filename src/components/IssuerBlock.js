import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { getDisplayName } from "../utils/displayName";

// Shows YOUR business details at the top of an invoice or receipt.
// If you have not saved a business profile yet, it falls back to your name and email.
export default function IssuerBlock({ title }) {
  const { businessProfile } = useData();
  const { user } = useAuth();

  if (!businessProfile) {
    return (
      <div>
        <h3 className="meta-title">{title}</h3>
        <address>
          <strong>{getDisplayName(user)}</strong>
          <br />
          {user.email}
        </address>
        <p className="field-hint no-print">
          <Link to="/settings" className="text-link">
            Add your business details
          </Link>{" "}
          to show them here.
        </p>
      </div>
    );
  }

  const profile = businessProfile;
  return (
    <div>
      <h3 className="meta-title">{title}</h3>
      <address>
        <strong>{profile.name}</strong>
        {profile.address && (
          <>
            <br />
            <span className="pre-line">{profile.address}</span>
          </>
        )}
        {profile.email && (
          <>
            <br />
            {profile.email}
          </>
        )}
        {profile.phone && (
          <>
            <br />
            {profile.phone}
          </>
        )}
        {profile.taxId && (
          <>
            <br />
            Tax ID: {profile.taxId}
          </>
        )}
      </address>
    </div>
  );
}
