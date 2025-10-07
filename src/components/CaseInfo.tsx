import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CaseInfoProps {
  caseName: string;
  description: string;
  species: string;
  condition: string;
}

const CaseInfo = ({ caseName, description, species, condition }: CaseInfoProps) => {
  return (
    <Card className="border-2 shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{caseName}</CardTitle>
            <CardDescription className="mt-1.5">{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {species}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Condição Primária:</span>
          <Badge variant="destructive">{condition}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseInfo;
