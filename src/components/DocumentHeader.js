import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { getDisplayName } from "../utils/displayName";

// The top of an invoice or receipt: YOUR business on the left, the document title on the right.
// `children` is shown under the number (a status badge or a PAID stamp).
export default function DocumentHeader({ title, number, children }) {
  const { businessProfile } = useData();
  const { user } = useAuth();

  const name = businessProfile ? businessProfile.name : getDisplayName(user);

  return (
    <header className="doc-header">
      <div>
        <p className="doc-business">{name}</p>
        <div className="doc-contact">
          {businessProfile ? (
            <>
              {businessProfile.address && (
                <div className="pre-line">{businessProfile.address}</div>
              )}
              {businessProfile.email && <div>{businessProfile.email}</div>}
              {businessProfile.phone && <div>{businessProfile.phone}</div>}
              {businessProfile.taxId && (
                <div>Tax ID: {businessProfile.taxId}</div>
              )}
            </>
          ) : (
            <>
              <div>{user.email}</div>
              <div className="no-print">
                <Link to="/settings" className="text-link">
                  Add your business details
                </Link>{" "}
                to show them here.
              </div>
            </>
          )}
        </div>
      </div>

      <div className="doc-title-block">
        <h2 className="doc-title">{title}</h2>
        <p className="doc-number">{number}</p>
        {children}
      </div>
    </header>
  );
}
